import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';
import {
  addWorkerPortfolioImages,
  createWorkerReview,
  getMyClientProfile,
  getMyUserProfile,
  getMyWorkerProfile,
  getWorkerById,
  getWorkerReviews,
  listWorkers,
  updateMyAvatar,
  updateMyClientProfile,
  updateMyUserProfile,
  updateMyWorkerProfile,
} from '../services/profileService.js';
import { toPublicUploadUrl } from '../utils/fileUrl.js';

export const getMeProfile = asyncHandler(async (req, res) => {
  const user = await getMyUserProfile(req.user._id);

  return sendSuccess(res, {
    message: 'User profile fetched successfully',
    data: user,
  });
});

export const updateMeProfile = asyncHandler(async (req, res) => {
  const user = await updateMyUserProfile(req.user._id, req.body);

  return sendSuccess(res, {
    message: 'User profile updated successfully',
    data: user,
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Avatar image is required', 400);
  }

  const user = await updateMyAvatar(req.user._id, toPublicUploadUrl(req.file.path));

  return sendSuccess(res, {
    message: 'Avatar uploaded successfully',
    data: user,
  });
});

export const getMyWorker = asyncHandler(async (req, res) => {
  const profile = await getMyWorkerProfile(req.user._id);

  return sendSuccess(res, {
    message: 'Worker profile fetched successfully',
    data: profile,
  });
});

export const updateMyWorker = asyncHandler(async (req, res) => {
  const profile = await updateMyWorkerProfile(req.user._id, req.body);

  return sendSuccess(res, {
    message: 'Worker profile updated successfully',
    data: profile,
  });
});

export const uploadWorkerPortfolio = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('At least one portfolio image is required', 400);
  }

  const imageUrls = req.files.map((file) => toPublicUploadUrl(file.path));
  const profile = await addWorkerPortfolioImages(req.user._id, imageUrls);

  return sendSuccess(res, {
    message: 'Worker portfolio images uploaded successfully',
    data: profile,
  });
});

export const getMyClient = asyncHandler(async (req, res) => {
  const profile = await getMyClientProfile(req.user._id);

  return sendSuccess(res, {
    message: 'Client profile fetched successfully',
    data: profile,
  });
});

export const updateMyClient = asyncHandler(async (req, res) => {
  const profile = await updateMyClientProfile(req.user._id, req.body);

  return sendSuccess(res, {
    message: 'Client profile updated successfully',
    data: profile,
  });
});

export const getWorkers = asyncHandler(async (req, res) => {
  const workers = await listWorkers(req.query);

  return sendSuccess(res, {
    message: 'Workers fetched successfully',
    data: workers,
  });
});

export const getWorker = asyncHandler(async (req, res) => {
  const worker = await getWorkerById(req.params.id);

  return sendSuccess(res, {
    message: 'Worker profile fetched successfully',
    data: worker,
  });
});

export const searchWorkers = asyncHandler(async (req, res) => {
  const workers = await listWorkers({ ...req.query, q: req.query.q || '' });

  return sendSuccess(res, {
    message: 'Worker search completed successfully',
    data: workers,
  });
});

export const getWorkerReviewList = asyncHandler(async (req, res) => {
  const reviews = await getWorkerReviews(req.params.id);

  return sendSuccess(res, {
    message: 'Worker reviews fetched successfully',
    data: reviews,
  });
});

export const addWorkerReview = asyncHandler(async (req, res) => {
  const review = await createWorkerReview(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Worker review created successfully',
    data: review,
  });
});
