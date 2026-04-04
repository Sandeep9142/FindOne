import { Review, WorkerProfile } from '../models/index.js';

function normalizeLimit(limit) {
  const parsed = Number(limit || 6);
  if (Number.isNaN(parsed)) {
    return 6;
  }

  return Math.min(Math.max(parsed, 1), 12);
}

export async function listPublicTestimonials(query = {}) {
  const limit = normalizeLimit(query.limit);

  const reviews = await Review.find({
    comment: { $exists: true, $ne: '' },
  })
    .populate('clientId', 'fullName avatarUrl role')
    .populate('workerId', 'fullName avatarUrl role')
    .sort({ createdAt: -1 })
    .limit(limit);

  const workerIds = reviews
    .map((review) => review.workerId?._id)
    .filter(Boolean);

  const workerProfiles = await WorkerProfile.find({ userId: { $in: workerIds } })
    .select('userId headline categories')
    .populate('categories', 'name');

  const profileMap = new Map(
    workerProfiles.map((profile) => [profile.userId.toString(), profile])
  );

  return reviews.map((review) => {
    const workerProfile = profileMap.get(review.workerId?._id?.toString?.() || '');
    const topCategory = workerProfile?.categories?.[0]?.name || '';

    return {
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      client: {
        _id: review.clientId?._id,
        fullName: review.clientId?.fullName || 'Client',
        avatarUrl: review.clientId?.avatarUrl || '',
        role: review.clientId?.role || 'client',
      },
      worker: {
        _id: review.workerId?._id,
        fullName: review.workerId?.fullName || 'Worker',
        avatarUrl: review.workerId?.avatarUrl || '',
        role: review.workerId?.role || 'worker',
        headline: workerProfile?.headline || '',
        topCategory,
      },
    };
  });
}
