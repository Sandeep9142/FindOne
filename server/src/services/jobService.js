import {
  APPLICATION_STATUSES,
  APPLICATION_TERMINAL_STATUSES,
  APPLICATION_WORKFLOW_STATUSES,
} from '../config/constants.js';
import { Category, Job, JobApplication, WorkerProfile } from '../models/index.js';
import AppError from '../utils/AppError.js';

const LEGACY_TO_WORKFLOW_STATUS = {
  pending: 'applied',
  shortlisted: 'verification',
  accepted: 'accepted_by_client',
};

const ACTIVE_APPLICATION_STATUSES = [
  'accepted_by_client',
  'work_started',
  'work_completed',
  'payment',
  'review',
  'accepted',
];

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

async function ensureCategory(categoryId) {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError('Invalid category id', 400);
  }

  return category;
}

async function getWorkerCategoryIds(workerId) {
  const workerProfile = await WorkerProfile.findOne({ userId: workerId }).select('categories');

  if (!workerProfile) {
    return [];
  }

  return workerProfile.categories.map((categoryId) => categoryId.toString());
}

function validateLocation(location) {
  if (!location || typeof location !== 'object') {
    throw new AppError('Location is required', 400);
  }

  if (!String(location.city || '').trim() || !String(location.state || '').trim()) {
    throw new AppError('Location city and state are required', 400);
  }
}

function buildJobPayload(payload) {
  const jobPayload = {
    ...(payload.title !== undefined ? { title: String(payload.title).trim() } : {}),
    ...(payload.description !== undefined ? { description: String(payload.description).trim() } : {}),
    ...(payload.budgetType !== undefined ? { budgetType: payload.budgetType } : {}),
    ...(payload.budgetMin !== undefined ? { budgetMin: Number(payload.budgetMin) } : {}),
    ...(payload.budgetMax !== undefined ? { budgetMax: Number(payload.budgetMax) } : {}),
    ...(payload.urgency !== undefined ? { urgency: payload.urgency } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.scheduledDate !== undefined
      ? { scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : null }
      : {}),
  };

  if (payload.location !== undefined) {
    validateLocation(payload.location);
    jobPayload.location = payload.location;
  }

  if (payload.skillsRequired !== undefined) {
    jobPayload.skillsRequired = sanitizeStringArray(payload.skillsRequired);
  }

  return jobPayload;
}

function validateCreateJobPayload(payload) {
  if (!String(payload.title || '').trim()) {
    throw new AppError('Job title is required', 400);
  }

  if (!String(payload.description || '').trim()) {
    throw new AppError('Job description is required', 400);
  }

  if (!payload.categoryId) {
    throw new AppError('Category id is required', 400);
  }

  if (!payload.budgetType) {
    throw new AppError('Budget type is required', 400);
  }

  validateLocation(payload.location);
}

async function getOwnedJobOrThrow(jobId, clientId) {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (job.clientId.toString() !== clientId.toString()) {
    throw new AppError('You do not have permission to modify this job', 403);
  }

  return job;
}

function baseJobPopulation(query) {
  return query
    .populate('clientId', 'fullName email avatarUrl role isVerified')
    .populate('categoryId', 'name slug icon')
    .populate('assignedWorkerId', 'fullName email avatarUrl role isVerified');
}

function applicationWithJobPopulation(query) {
  return query
    .populate('workerId', 'fullName email avatarUrl role isVerified')
    .populate({
      path: 'jobId',
      populate: [
        { path: 'clientId', select: 'fullName email avatarUrl role isVerified' },
        { path: 'categoryId', select: 'name slug icon' },
        { path: 'assignedWorkerId', select: 'fullName email avatarUrl role isVerified' },
      ],
    });
}

function normalizeApplicationStatus(status) {
  return LEGACY_TO_WORKFLOW_STATUS[status] || status;
}

function getEntityId(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function getNextWorkflowStatus(status) {
  const currentIndex = APPLICATION_WORKFLOW_STATUSES.indexOf(status);
  if (currentIndex === -1 || currentIndex === APPLICATION_WORKFLOW_STATUSES.length - 1) {
    return null;
  }

  return APPLICATION_WORKFLOW_STATUSES[currentIndex + 1];
}

function appendApplicationStatusHistory(application, { status, requester, note }) {
  application.statusHistory.push({
    status,
    changedBy: requester._id,
    changedByRole: requester.role,
    changedAt: new Date(),
    note: note || '',
  });
}

function getApplicationAccess(application, requester) {
  const requesterId = requester._id.toString();
  const workerId = application.workerId.toString();
  const clientId = application.jobId?.clientId?.toString?.() || '';

  return {
    isAdmin: requester.role === 'admin',
    isWorkerOwner: workerId === requesterId,
    isClientOwner: clientId === requesterId,
  };
}

function validateTerminalTransition({ currentStatus, nextStatus, isAdmin }) {
  if (isAdmin) {
    return;
  }

  const allowedCurrentByTarget = {
    withdrawn: ['applied', 'verification', 'accepted_by_client'],
    rejected: ['applied', 'verification'],
    cancelled: ['accepted_by_client', 'work_started'],
  };

  const allowedCurrent = allowedCurrentByTarget[nextStatus] || [];
  if (!allowedCurrent.includes(currentStatus)) {
    throw new AppError(`Cannot move application from ${currentStatus} to ${nextStatus}`, 400);
  }
}

function validateTargetByRequesterRole({ nextStatus, isAdmin, isWorkerOwner, isClientOwner }) {
  if (isAdmin) {
    return;
  }

  if (isWorkerOwner) {
    const workerAllowedTargets = ['work_started', 'withdrawn'];
    if (!workerAllowedTargets.includes(nextStatus)) {
      throw new AppError('Workers cannot set this status', 403);
    }
    return;
  }

  if (isClientOwner) {
    const clientAllowedTargets = [
      'verification',
      'accepted_by_client',
      'work_completed',
      'payment',
      'cancelled',
      'rejected',
      'review',
    ];
    if (!clientAllowedTargets.includes(nextStatus)) {
      throw new AppError('Clients cannot set this status', 403);
    }
    return;
  }

  throw new AppError('You do not have permission to update this application', 403);
}

async function ensureNoCompetingAcceptedApplication(application) {
  const competingAccepted = await JobApplication.findOne({
    jobId: application.jobId._id,
    _id: { $ne: application._id },
    status: { $in: ACTIVE_APPLICATION_STATUSES },
  }).select('_id');

  if (competingAccepted) {
    throw new AppError('Another worker is already active on this job', 409);
  }
}

async function rejectCompetingApplications(application, requester) {
  const competingApplications = await JobApplication.find({
    jobId: application.jobId._id,
    _id: { $ne: application._id },
    status: { $in: ['applied', 'verification', 'pending', 'shortlisted'] },
  });

  if (competingApplications.length === 0) {
    return;
  }

  await Promise.all(
    competingApplications.map((competingApplication) => {
      competingApplication.status = 'rejected';
      appendApplicationStatusHistory(competingApplication, {
        status: 'rejected',
        requester,
        note: 'Another worker was accepted for this job.',
      });
      return competingApplication.save();
    })
  );
}

async function syncJobFromApplicationStatus(application, status) {
  const job = await Job.findById(application.jobId._id);

  if (!job) {
    return;
  }

  if (status === 'accepted_by_client') {
    job.assignedWorkerId = application.workerId;
    job.status = 'assigned';
    await job.save();
    return;
  }

  if (status === 'work_started') {
    job.assignedWorkerId = application.workerId;
    job.status = 'in_progress';
    await job.save();
    return;
  }

  if (status === 'work_completed') {
    job.assignedWorkerId = application.workerId;
    job.status = 'completed';
    await job.save();
    return;
  }

  if (status === 'cancelled') {
    if (job.assignedWorkerId?.toString() === application.workerId.toString()) {
      job.assignedWorkerId = null;
      if (job.status !== 'completed') {
        job.status = 'open';
      }
      await job.save();
    }
  }
}

async function attachWorkerProfileIds(applications) {
  if (!Array.isArray(applications) || applications.length === 0) {
    return [];
  }

  const workerUserIds = [...new Set(applications.map((application) => getEntityId(application.workerId)).filter(Boolean))];

  if (workerUserIds.length === 0) {
    return applications.map((application) => (application.toObject ? application.toObject() : application));
  }

  const profiles = await WorkerProfile.find({ userId: { $in: workerUserIds } }).select('_id userId').lean();
  const profileIdByUserId = new Map(profiles.map((profile) => [profile.userId.toString(), profile._id.toString()]));

  return applications.map((application) => {
    const plainApplication = application.toObject ? application.toObject() : application;
    const workerUserId = getEntityId(plainApplication.workerId);

    return {
      ...plainApplication,
      workerProfileId: profileIdByUserId.get(workerUserId) || '',
    };
  });
}

async function attachWorkerProfileId(application) {
  if (!application) {
    return application;
  }

  const [applicationWithProfile] = await attachWorkerProfileIds([application]);
  return applicationWithProfile || application;
}

export async function listJobs(query, requester = null) {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.categoryId) {
    filters.categoryId = query.categoryId;
  }

  if (query.clientId) {
    filters.clientId = query.clientId;
  }

  if (query.assignedWorkerId) {
    filters.assignedWorkerId = query.assignedWorkerId;
  }

  if (query.openOnly === 'true') {
    filters.status = 'open';
  }

  if (query.matchWorkerCategories === 'true' && requester?.role === 'worker') {
    const workerCategoryIds = await getWorkerCategoryIds(requester._id);

    if (workerCategoryIds.length === 0) {
      return [];
    }

    if (query.categoryId) {
      if (!workerCategoryIds.includes(query.categoryId)) {
        return [];
      }

      filters.categoryId = query.categoryId;
    } else {
      filters.categoryId = { $in: workerCategoryIds };
    }
  }

  const searchText = query.q?.trim();
  if (searchText) {
    filters.$text = { $search: searchText };
  }

  const limit = Math.min(Number(query.limit) || 20, 50);

  const jobs = await baseJobPopulation(
    Job.find(filters).sort(
      searchText ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 }
    )
  ).limit(limit);

  return jobs;
}

export async function getJobById(jobId) {
  const job = await baseJobPopulation(Job.findById(jobId));

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return job;
}

export async function createJob(clientId, payload) {
  validateCreateJobPayload(payload);
  await ensureCategory(payload.categoryId);

  const job = await Job.create({
    clientId,
    categoryId: payload.categoryId,
    title: String(payload.title).trim(),
    description: String(payload.description).trim(),
    skillsRequired: sanitizeStringArray(payload.skillsRequired),
    location: payload.location,
    budgetType: payload.budgetType,
    budgetMin: Number(payload.budgetMin || 0),
    budgetMax: Number(payload.budgetMax || 0),
    urgency: payload.urgency || 'medium',
    scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : null,
  });

  return getJobById(job._id);
}

export async function updateJob(jobId, clientId, payload) {
  const job = await getOwnedJobOrThrow(jobId, clientId);

  if (payload.categoryId !== undefined) {
    await ensureCategory(payload.categoryId);
    job.categoryId = payload.categoryId;
  }

  const updateData = buildJobPayload(payload);
  Object.assign(job, updateData);
  await job.save();

  return getJobById(job._id);
}

export async function deleteJob(jobId, clientId) {
  const job = await getOwnedJobOrThrow(jobId, clientId);
  await JobApplication.deleteMany({ jobId: job._id });
  await job.deleteOne();
}

export async function applyToJob(jobId, workerId, payload) {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (job.status !== 'open') {
    throw new AppError('Only open jobs can receive applications', 400);
  }

  const workerCategoryIds = await getWorkerCategoryIds(workerId);
  const jobCategoryId = job.categoryId?.toString();

  if (!jobCategoryId || !workerCategoryIds.includes(jobCategoryId)) {
    throw new AppError('You can only apply to jobs that match your service categories', 403);
  }

  const existingApplication = await JobApplication.findOne({ jobId, workerId });
  if (existingApplication) {
    throw new AppError('You have already applied to this job', 409);
  }

  const application = await JobApplication.create({
    jobId,
    workerId,
    coverMessage: payload.coverMessage ? String(payload.coverMessage).trim() : '',
    proposedRate: payload.proposedRate !== undefined ? Number(payload.proposedRate) : 0,
    status: 'applied',
    statusHistory: [
      {
        status: 'applied',
        changedBy: workerId,
        changedByRole: 'worker',
        changedAt: new Date(),
      },
    ],
  });

  job.applicationCount += 1;
  await job.save();

  return application;
}

export async function getJobApplications(jobId, requester) {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const isOwner = job.clientId.toString() === requester._id.toString();
  const isAdmin = requester.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to view these applications', 403);
  }

  const applications = await applicationWithJobPopulation(JobApplication.find({ jobId }).sort({ createdAt: -1 }));

  return attachWorkerProfileIds(applications);
}

export async function listMyPostedJobs(clientId) {
  return baseJobPopulation(Job.find({ clientId }).sort({ createdAt: -1 }));
}

export async function listMyAppliedJobs(workerId) {
  const applications = await applicationWithJobPopulation(JobApplication.find({ workerId }).sort({ createdAt: -1 }));
  return attachWorkerProfileIds(applications);
}

export async function updateApplicationStatus(applicationId, requester, payload) {
  const nextStatus = payload.status;
  const note = payload.note ? String(payload.note).trim() : '';

  if (!APPLICATION_STATUSES.includes(nextStatus)) {
    throw new AppError('Invalid application status', 400);
  }

  if (
    !APPLICATION_WORKFLOW_STATUSES.includes(nextStatus) &&
    !APPLICATION_TERMINAL_STATUSES.includes(nextStatus)
  ) {
    throw new AppError('Legacy statuses are read-only. Use workflow statuses only.', 400);
  }

  const application = await JobApplication.findById(applicationId).populate('jobId', 'clientId');

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (!application.jobId) {
    throw new AppError('The job linked to this application was not found', 404);
  }

  const { isAdmin, isWorkerOwner, isClientOwner } = getApplicationAccess(application, requester);

  if (!isAdmin && !isWorkerOwner && !isClientOwner) {
    throw new AppError('You do not have permission to update this application', 403);
  }

  const currentStatus = normalizeApplicationStatus(application.status);

  if (currentStatus === nextStatus) {
    const currentApplication = await applicationWithJobPopulation(JobApplication.findById(application._id));
    return attachWorkerProfileId(currentApplication);
  }

  if (APPLICATION_TERMINAL_STATUSES.includes(currentStatus) && !isAdmin) {
    throw new AppError('Terminal applications cannot be updated', 400);
  }

  validateTargetByRequesterRole({ nextStatus, isAdmin, isWorkerOwner, isClientOwner });

  if (APPLICATION_WORKFLOW_STATUSES.includes(nextStatus) && !isAdmin) {
    const expectedNextStatus = getNextWorkflowStatus(currentStatus);
    if (!expectedNextStatus || expectedNextStatus !== nextStatus) {
      throw new AppError(`Next expected status is ${expectedNextStatus || 'none'}`, 400);
    }
  }

  if (APPLICATION_TERMINAL_STATUSES.includes(nextStatus)) {
    validateTerminalTransition({ currentStatus, nextStatus, isAdmin });
  }

  if (nextStatus === 'accepted_by_client') {
    await ensureNoCompetingAcceptedApplication(application);
  }

  application.status = nextStatus;
  appendApplicationStatusHistory(application, { status: nextStatus, requester, note });
  await application.save();

  if (nextStatus === 'accepted_by_client') {
    await rejectCompetingApplications(application, requester);
  }

  await syncJobFromApplicationStatus(application, nextStatus);

  const updatedApplication = await applicationWithJobPopulation(JobApplication.findById(application._id));
  return attachWorkerProfileId(updatedApplication);
}
