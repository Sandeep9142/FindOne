import { Category, ClientProfile, Review, User, WorkerProfile } from '../models/index.js';
import AppError from '../utils/AppError.js';

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function sanitizeObjectArray(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item) => item && typeof item === 'object');
}

function buildUserProfile(user) {
  return user?.toSafeObject ? user.toSafeObject() : user;
}

async function updateWorkerRating(workerId) {
  const stats = await Review.aggregate([
    { $match: { workerId } },
    {
      $group: {
        _id: '$workerId',
        ratingAverage: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const ratingAverage = stats[0]?.ratingAverage || 0;
  const ratingCount = stats[0]?.ratingCount || 0;

  await WorkerProfile.findOneAndUpdate(
    { userId: workerId },
    {
      $set: {
        ratingAverage: Number(ratingAverage.toFixed(1)),
        ratingCount,
      },
      $setOnInsert: {
        userId: workerId,
      },
    },
    { upsert: true, runValidators: true }
  );
}

async function ensureCategoryIds(categoryIds = []) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return [];
  }

  const categories = await Category.find({ _id: { $in: categoryIds } }).select('_id');

  if (categories.length !== categoryIds.length) {
    throw new AppError('One or more category ids are invalid', 400);
  }

  return categoryIds;
}

function buildWorkerUpdatePayload(payload) {
  return {
    ...(payload.headline !== undefined ? { headline: String(payload.headline).trim() } : {}),
    ...(payload.bio !== undefined ? { bio: String(payload.bio).trim() } : {}),
    ...(payload.experienceYears !== undefined ? { experienceYears: Number(payload.experienceYears) } : {}),
    ...(payload.hourlyRate !== undefined ? { hourlyRate: Number(payload.hourlyRate) } : {}),
    ...(payload.isAvailableNow !== undefined ? { isAvailableNow: Boolean(payload.isAvailableNow) } : {}),
    ...(sanitizeStringArray(payload.skills) !== undefined ? { skills: sanitizeStringArray(payload.skills) } : {}),
    ...(sanitizeStringArray(payload.languages) !== undefined ? { languages: sanitizeStringArray(payload.languages) } : {}),
    ...(sanitizeStringArray(payload.portfolioImages) !== undefined
      ? { portfolioImages: sanitizeStringArray(payload.portfolioImages) }
      : {}),
    ...(sanitizeObjectArray(payload.serviceAreas) !== undefined ? { serviceAreas: sanitizeObjectArray(payload.serviceAreas) } : {}),
    ...(sanitizeObjectArray(payload.availability) !== undefined ? { availability: sanitizeObjectArray(payload.availability) } : {}),
  };
}

function buildClientUpdatePayload(payload) {
  return {
    ...(payload.companyName !== undefined ? { companyName: String(payload.companyName).trim() } : {}),
    ...(payload.address !== undefined ? { address: String(payload.address).trim() } : {}),
    ...(sanitizeObjectArray(payload.preferredLocations) !== undefined
      ? { preferredLocations: sanitizeObjectArray(payload.preferredLocations) }
      : {}),
  };
}

export async function getMyUserProfile(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return buildUserProfile(user);
}

export async function updateMyUserProfile(userId, payload) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (payload.fullName !== undefined) {
    user.fullName = String(payload.fullName).trim();
  }

  if (payload.phone !== undefined) {
    user.phone = payload.phone ? String(payload.phone).trim() : undefined;
  }

  if (payload.avatarUrl !== undefined) {
    user.avatarUrl = String(payload.avatarUrl).trim();
  }

  await user.save();

  return buildUserProfile(user);
}

export async function updateMyAvatar(userId, avatarUrl) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.avatarUrl = avatarUrl;
  await user.save();

  return buildUserProfile(user);
}

export async function getMyWorkerProfile(userId) {
  let profile = await WorkerProfile.findOne({ userId })
    .populate('userId', 'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt')
    .populate('categories', 'name slug icon');

  if (!profile) {
    profile = await WorkerProfile.create({ userId });
    profile = await WorkerProfile.findById(profile._id)
      .populate('userId', 'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt')
      .populate('categories', 'name slug icon');
  }

  return profile;
}

export async function updateMyWorkerProfile(userId, payload) {
  const updateData = buildWorkerUpdatePayload(payload);

  if (payload.categories !== undefined) {
    updateData.categories = await ensureCategoryIds(payload.categories);
  }

  const profile = await WorkerProfile.findOneAndUpdate(
    { userId },
    { $set: updateData, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('userId', 'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt')
    .populate('categories', 'name slug icon');

  return profile;
}

export async function addWorkerPortfolioImages(userId, imageUrls) {
  const profile = await WorkerProfile.findOneAndUpdate(
    { userId },
    {
      $push: {
        portfolioImages: {
          $each: imageUrls,
        },
      },
      $setOnInsert: { userId },
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('userId', 'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt')
    .populate('categories', 'name slug icon');

  return profile;
}

export async function getMyClientProfile(userId) {
  let profile = await ClientProfile.findOne({ userId }).populate(
    'userId',
    'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt'
  );

  if (!profile) {
    profile = await ClientProfile.create({ userId });
    profile = await ClientProfile.findById(profile._id).populate(
      'userId',
      'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt'
    );
  }

  return profile;
}

export async function updateMyClientProfile(userId, payload) {
  const profile = await ClientProfile.findOneAndUpdate(
    { userId },
    { $set: buildClientUpdatePayload(payload), $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  ).populate('userId', 'fullName email phone avatarUrl role isVerified isActive lastLoginAt createdAt updatedAt');

  return profile;
}

export async function listWorkers(query) {
  const filters = {};

  if (query.category) {
    filters.categories = query.category;
  }

  if (query.availableNow === 'true') {
    filters.isAvailableNow = true;
  }

  const searchText = query.q?.trim();
  if (searchText) {
    filters.$text = { $search: searchText };
  }

  const workers = await WorkerProfile.find(filters)
    .populate('userId', 'fullName avatarUrl role isVerified')
    .populate('categories', 'name slug icon')
    .sort(searchText ? { score: { $meta: 'textScore' }, ratingAverage: -1 } : { ratingAverage: -1, jobsCompleted: -1 })
    .limit(Math.min(Number(query.limit) || 20, 50));

  return workers;
}

export async function getWorkerById(workerId) {
  const worker = await WorkerProfile.findById(workerId)
    .populate('userId', 'fullName email phone avatarUrl role isVerified createdAt')
    .populate('categories', 'name slug icon');

  if (!worker) {
    throw new AppError('Worker profile not found', 404);
  }

  return worker;
}

export async function getWorkerReviews(workerId) {
  const workerProfile = await WorkerProfile.findById(workerId).select('userId');

  if (!workerProfile) {
    throw new AppError('Worker profile not found', 404);
  }

  const reviews = await Review.find({ workerId: workerProfile.userId })
    .populate('clientId', 'fullName avatarUrl role isVerified')
    .sort({ createdAt: -1 })
    .limit(20);
  return reviews;
}

export async function createWorkerReview(workerId, requester, payload) {
  if (requester.role !== 'client' && requester.role !== 'admin') {
    throw new AppError('Only client accounts can create worker reviews', 403);
  }

  const workerProfile = await WorkerProfile.findById(workerId).select('userId');

  if (!workerProfile) {
    throw new AppError('Worker profile not found', 404);
  }

  if (workerProfile.userId.toString() === requester._id.toString()) {
    throw new AppError('You cannot review your own profile', 400);
  }

  const rating = Number(payload.rating);
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const existingReview = await Review.findOne({
    workerId: workerProfile.userId,
    clientId: requester._id,
    bookingId: { $exists: false },
    jobId: { $exists: false },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this worker', 409);
  }

  const review = await Review.create({
    clientId: requester._id,
    workerId: workerProfile.userId,
    rating,
    comment: payload.comment ? String(payload.comment).trim() : '',
    tags: sanitizeStringArray(payload.tags) || [],
  });

  await updateWorkerRating(workerProfile.userId);

  const populatedReview = await Review.findById(review._id)
    .populate('clientId', 'fullName avatarUrl role isVerified')
    .populate('workerId', 'fullName avatarUrl role isVerified');

  return populatedReview;
}
