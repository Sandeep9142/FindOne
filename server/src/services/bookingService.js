import { BOOKING_STATUSES } from '../config/constants.js';
import { Booking, Category, Review, User, WorkerProfile } from '../models/index.js';
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
}

async function ensureWorker(workerId) {
  const worker = await User.findById(workerId);

  if (!worker || worker.role !== 'worker') {
    throw new AppError('Invalid worker id', 400);
  }
}

function validateAddress(address) {
  if (!address || typeof address !== 'object') {
    throw new AppError('Address is required', 400);
  }

  if (!String(address.city || '').trim() || !String(address.state || '').trim()) {
    throw new AppError('Address city and state are required', 400);
  }
}

function populateBooking(query) {
  return query
    .populate('clientId', 'fullName email avatarUrl role isVerified')
    .populate('workerId', 'fullName email avatarUrl role isVerified')
    .populate('categoryId', 'name slug icon');
}

function toPlainBooking(booking) {
  if (!booking) {
    return booking;
  }

  return booking.toObject ? booking.toObject() : booking;
}

async function attachBookingReviews(bookings) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return [];
  }

  const bookingIds = bookings.map((booking) => booking._id);
  const reviews = await Review.find({ bookingId: { $in: bookingIds } })
    .select('bookingId rating comment tags createdAt')
    .sort({ createdAt: -1 });

  const reviewMap = new Map(
    reviews.map((review) => [review.bookingId.toString(), review.toObject()])
  );

  return bookings.map((booking) => {
    const plainBooking = toPlainBooking(booking);
    return {
      ...plainBooking,
      review: reviewMap.get(plainBooking._id.toString()) || null,
    };
  });
}

function getIdValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function buildBookingUpdatePayload(payload) {
  const update = {
    ...(payload.title !== undefined ? { title: String(payload.title).trim() } : {}),
    ...(payload.description !== undefined ? { description: String(payload.description).trim() } : {}),
    ...(payload.timeSlot !== undefined ? { timeSlot: String(payload.timeSlot).trim() } : {}),
    ...(payload.pricingType !== undefined ? { pricingType: payload.pricingType } : {}),
    ...(payload.amount !== undefined ? { amount: Number(payload.amount) } : {}),
    ...(payload.notes !== undefined ? { notes: String(payload.notes).trim() } : {}),
  };

  if (payload.bookingDate !== undefined) {
    update.bookingDate = new Date(payload.bookingDate);
  }

  if (payload.address !== undefined) {
    validateAddress(payload.address);
    update.address = payload.address;
  }

  return update;
}

async function getBookingOrThrow(bookingId) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return booking;
}

function canAccessBooking(booking, requester) {
  return (
    requester.role === 'admin' ||
    getIdValue(booking.clientId) === getIdValue(requester._id) ||
    getIdValue(booking.workerId) === getIdValue(requester._id)
  );
}

export async function listBookings(requester, query) {
  const filters = {};

  if (requester.role === 'client') {
    filters.clientId = requester._id;
  } else if (requester.role === 'worker') {
    filters.workerId = requester._id;
  }

  if (query.status) {
    filters.status = query.status;
  }

  const bookings = await populateBooking(
    Booking.find(filters).sort({ bookingDate: -1, createdAt: -1 })
  ).limit(Math.min(Number(query.limit) || 20, 50));

  return attachBookingReviews(bookings);
}

export async function getBookingById(bookingId, requester) {
  const booking = await populateBooking(Booking.findById(bookingId));

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!canAccessBooking(booking, requester)) {
    throw new AppError('You do not have permission to view this booking', 403);
  }

  const [bookingWithReview] = await attachBookingReviews([booking]);
  return bookingWithReview;
}

export async function createBooking(clientId, payload) {
  if (!payload.workerId) {
    throw new AppError('Worker id is required', 400);
  }

  if (!payload.categoryId) {
    throw new AppError('Category id is required', 400);
  }

  if (!String(payload.title || '').trim()) {
    throw new AppError('Booking title is required', 400);
  }

  if (!payload.bookingDate) {
    throw new AppError('Booking date is required', 400);
  }

  if (payload.amount === undefined) {
    throw new AppError('Amount is required', 400);
  }

  validateAddress(payload.address);
  await ensureWorker(payload.workerId);
  await ensureCategory(payload.categoryId);

  const booking = await Booking.create({
    clientId,
    workerId: payload.workerId,
    categoryId: payload.categoryId,
    title: String(payload.title).trim(),
    description: payload.description ? String(payload.description).trim() : '',
    bookingDate: new Date(payload.bookingDate),
    timeSlot: payload.timeSlot ? String(payload.timeSlot).trim() : '',
    address: payload.address,
    pricingType: payload.pricingType || 'fixed',
    amount: Number(payload.amount),
    notes: payload.notes ? String(payload.notes).trim() : '',
  });

  return getBookingById(booking._id, { _id: clientId, role: 'client' });
}

export async function updateBookingStatus(bookingId, requester, status) {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new AppError('Invalid booking status', 400);
  }

  const booking = await getBookingOrThrow(bookingId);

  if (!canAccessBooking(booking, requester)) {
    throw new AppError('You do not have permission to update this booking', 403);
  }

  booking.status = status;
  await booking.save();

  return getBookingById(booking._id, requester);
}

export async function cancelBooking(bookingId, requester) {
  const booking = await getBookingOrThrow(bookingId);

  if (!canAccessBooking(booking, requester)) {
    throw new AppError('You do not have permission to cancel this booking', 403);
  }

  booking.status = 'cancelled';
  await booking.save();

  return getBookingById(booking._id, requester);
}

export async function updateBooking(bookingId, requester, payload) {
  const booking = await getBookingOrThrow(bookingId);

  if (getIdValue(booking.clientId) !== getIdValue(requester._id) && requester.role !== 'admin') {
    throw new AppError('Only the client can edit this booking', 403);
  }

  Object.assign(booking, buildBookingUpdatePayload(payload));
  await booking.save();

  return getBookingById(booking._id, requester);
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

export async function createBookingReview(bookingId, requester, payload) {
  const booking = await getBookingOrThrow(bookingId);

  if (getIdValue(booking.clientId) !== getIdValue(requester._id) && requester.role !== 'admin') {
    throw new AppError('Only the client can review this booking', 403);
  }

  if (booking.status !== 'completed') {
    throw new AppError('Reviews can only be added after a completed booking', 400);
  }

  if (!payload.rating || Number(payload.rating) < 1 || Number(payload.rating) > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    throw new AppError('A review already exists for this booking', 409);
  }

  const review = await Review.create({
    bookingId,
    clientId: booking.clientId,
    workerId: booking.workerId,
    rating: Number(payload.rating),
    comment: payload.comment ? String(payload.comment).trim() : '',
    tags: sanitizeStringArray(payload.tags),
  });

  await updateWorkerRating(booking.workerId);

  return review;
}
