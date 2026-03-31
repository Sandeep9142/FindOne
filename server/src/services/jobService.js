import { APPLICATION_STATUSES, JOB_STATUSES } from '../config/constants.js';
import { Category, Job, JobApplication } from '../models/index.js';
import AppError from '../utils/AppError.js';

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

export async function listJobs(query) {
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

  const existingApplication = await JobApplication.findOne({ jobId, workerId });
  if (existingApplication) {
    throw new AppError('You have already applied to this job', 409);
  }

  const application = await JobApplication.create({
    jobId,
    workerId,
    coverMessage: payload.coverMessage ? String(payload.coverMessage).trim() : '',
    proposedRate: payload.proposedRate !== undefined ? Number(payload.proposedRate) : 0,
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

  const applications = await JobApplication.find({ jobId })
    .populate('workerId', 'fullName email avatarUrl role isVerified')
    .sort({ createdAt: -1 });

  return applications;
}

export async function listMyPostedJobs(clientId) {
  return baseJobPopulation(Job.find({ clientId }).sort({ createdAt: -1 }));
}

export async function listMyAppliedJobs(workerId) {
  return JobApplication.find({ workerId })
    .populate({
      path: 'jobId',
      populate: [
        { path: 'clientId', select: 'fullName email avatarUrl role isVerified' },
        { path: 'categoryId', select: 'name slug icon' },
        { path: 'assignedWorkerId', select: 'fullName email avatarUrl role isVerified' },
      ],
    })
    .sort({ createdAt: -1 });
}
