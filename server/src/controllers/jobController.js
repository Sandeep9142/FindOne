import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  applyToJob,
  createJob,
  deleteJob,
  getJobApplications,
  getJobById,
  listJobs,
  listMyAppliedJobs,
  listMyPostedJobs,
  updateJob,
} from '../services/jobService.js';

export const getJobs = asyncHandler(async (req, res) => {
  const jobs = await listJobs(req.query);

  return sendSuccess(res, {
    message: 'Jobs fetched successfully',
    data: jobs,
  });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await getJobById(req.params.id);

  return sendSuccess(res, {
    message: 'Job fetched successfully',
    data: job,
  });
});

export const createClientJob = asyncHandler(async (req, res) => {
  const job = await createJob(req.user._id, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Job created successfully',
    data: job,
  });
});

export const updateClientJob = asyncHandler(async (req, res) => {
  const job = await updateJob(req.params.id, req.user._id, req.body);

  return sendSuccess(res, {
    message: 'Job updated successfully',
    data: job,
  });
});

export const deleteClientJob = asyncHandler(async (req, res) => {
  await deleteJob(req.params.id, req.user._id);

  return sendSuccess(res, {
    message: 'Job deleted successfully',
  });
});

export const applyForJob = asyncHandler(async (req, res) => {
  const application = await applyToJob(req.params.id, req.user._id, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Job application submitted successfully',
    data: application,
  });
});

export const getApplicationsForJob = asyncHandler(async (req, res) => {
  const applications = await getJobApplications(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Job applications fetched successfully',
    data: applications,
  });
});

export const getMyPostedJobs = asyncHandler(async (req, res) => {
  const jobs = await listMyPostedJobs(req.user._id);

  return sendSuccess(res, {
    message: 'Posted jobs fetched successfully',
    data: jobs,
  });
});

export const getMyAppliedJobs = asyncHandler(async (req, res) => {
  const applications = await listMyAppliedJobs(req.user._id);

  return sendSuccess(res, {
    message: 'Applied jobs fetched successfully',
    data: applications,
  });
});
