import { PAYMENT_STATUSES } from '../config/constants.js';
import { Booking, Job, Payment, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

function getIdValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function canAccessPayment(payment, requester) {
  return (
    requester.role === 'admin' ||
    getIdValue(payment.clientId) === getIdValue(requester._id) ||
    getIdValue(payment.workerId) === getIdValue(requester._id)
  );
}

function canManagePayment(payment, requester) {
  return (
    requester.role === 'admin' ||
    getIdValue(payment.clientId) === getIdValue(requester._id)
  );
}

function populatePayment(query) {
  return query
    .populate('clientId', 'fullName email avatarUrl role isVerified')
    .populate('workerId', 'fullName email avatarUrl role isVerified')
    .populate('bookingId', 'title status paymentStatus bookingDate amount')
    .populate('jobId', 'title status paymentStatus budgetType budgetMin budgetMax');
}

async function ensureWorker(workerId) {
  const worker = await User.findById(workerId).select('_id role');

  if (!worker || worker.role !== 'worker') {
    throw new AppError('Invalid worker id', 400);
  }
}

async function syncTargetPaymentStatus({ booking, job, status }) {
  if (booking) {
    booking.paymentStatus = status;
    await booking.save();
  }

  if (job) {
    job.paymentStatus = status;
    await job.save();
  }
}

async function resolvePaymentTarget(requester, payload) {
  const hasBooking = Boolean(payload.bookingId);
  const hasJob = Boolean(payload.jobId);

  if (hasBooking === hasJob) {
    throw new AppError('Provide exactly one of bookingId or jobId', 400);
  }

  let booking = null;
  let job = null;
  let clientId = null;
  let workerId = null;
  let amount = null;

  if (hasBooking) {
    booking = await Booking.findById(payload.bookingId);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (requester.role !== 'admin' && getIdValue(booking.clientId) !== getIdValue(requester._id)) {
      throw new AppError('You do not have permission to pay for this booking', 403);
    }

    clientId = booking.clientId;
    workerId = booking.workerId;
    amount = booking.amount;
  }

  if (hasJob) {
    job = await Job.findById(payload.jobId);

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (requester.role !== 'admin' && getIdValue(job.clientId) !== getIdValue(requester._id)) {
      throw new AppError('You do not have permission to pay for this job', 403);
    }

    const resolvedWorkerId = payload.workerId || job.assignedWorkerId;
    if (!resolvedWorkerId) {
      throw new AppError('workerId is required when paying for a job without an assigned worker', 400);
    }

    await ensureWorker(resolvedWorkerId);

    clientId = job.clientId;
    workerId = resolvedWorkerId;
    amount = payload.amount !== undefined ? Number(payload.amount) : Number(job.budgetMax || job.budgetMin || 0);
  }

  return { booking, job, clientId, workerId, amount };
}

export async function listPayments(requester, query) {
  const filters = {};

  if (requester.role === 'client') {
    filters.clientId = requester._id;
  } else if (requester.role === 'worker') {
    filters.workerId = requester._id;
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.bookingId) {
    filters.bookingId = query.bookingId;
  }

  if (query.jobId) {
    filters.jobId = query.jobId;
  }

  const payments = await populatePayment(
    Payment.find(filters).sort({ createdAt: -1 })
  ).limit(Math.min(Number(query.limit) || 20, 50));

  return payments;
}

export async function getPaymentById(paymentId, requester) {
  const payment = await populatePayment(Payment.findById(paymentId));

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (!canAccessPayment(payment, requester)) {
    throw new AppError('You do not have permission to view this payment', 403);
  }

  return payment;
}

export async function createPayment(requester, payload) {
  const { booking, job, clientId, workerId, amount } = await resolvePaymentTarget(requester, payload);

  const targetFilters = booking ? { bookingId: booking._id } : { jobId: job._id };
  const existingActivePayment = await Payment.findOne({
    ...targetFilters,
    status: { $in: ['pending', 'authorized', 'paid'] },
  });

  if (existingActivePayment) {
    throw new AppError('An active payment already exists for this target', 409);
  }

  const paymentStatus = payload.status && PAYMENT_STATUSES.includes(payload.status) ? payload.status : 'pending';
  const paymentAmount = payload.amount !== undefined ? Number(payload.amount) : amount;

  if (!paymentAmount || paymentAmount < 0) {
    throw new AppError('A valid payment amount is required', 400);
  }

  const payment = await Payment.create({
    bookingId: booking?._id || null,
    jobId: job?._id || null,
    clientId,
    workerId,
    amount: paymentAmount,
    currency: payload.currency ? String(payload.currency).trim().toUpperCase() : 'INR',
    provider: payload.provider ? String(payload.provider).trim() : 'manual',
    providerPaymentId: payload.providerPaymentId ? String(payload.providerPaymentId).trim() : null,
    status: paymentStatus,
    paidAt: paymentStatus === 'paid' ? new Date() : null,
  });

  await syncTargetPaymentStatus({ booking, job, status: paymentStatus });

  return getPaymentById(payment._id, requester);
}

export async function updatePaymentStatus(paymentId, requester, status) {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new AppError('Invalid payment status', 400);
  }

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (!canManagePayment(payment, requester)) {
    throw new AppError('You do not have permission to update this payment', 403);
  }

  payment.status = status;
  payment.paidAt = status === 'paid' ? new Date() : null;
  await payment.save();

  const booking = payment.bookingId ? await Booking.findById(payment.bookingId) : null;
  const job = payment.jobId ? await Job.findById(payment.jobId) : null;
  await syncTargetPaymentStatus({ booking, job, status });

  return getPaymentById(payment._id, requester);
}
