import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PAYMENT_STATUSES } from '../config/constants.js';
import { env } from '../config/env.js';
import { Booking, Job, JobApplication, Payment, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

const APPLICATION_PAYMENT_READY_STATUSES = new Set(['work_completed', 'payment', 'review']);

function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError(
      'Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      503
    );
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
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

async function markApplicationAsPaid({ jobId, workerId, changedBy, changedByRole, note }) {
  if (!jobId || !workerId) {
    return;
  }

  const application = await JobApplication.findOne({ jobId, workerId });
  if (!application) {
    return;
  }

  if (application.status === 'work_completed') {
    application.status = 'payment';
    application.statusHistory.push({
      status: 'payment',
      changedBy,
      changedByRole: changedByRole || 'client',
      changedAt: new Date(),
      note: note || 'Payment captured',
    });
    await application.save();
  }
}

function sanitizeAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError('A valid payment amount is required', 400);
  }

  return Number(value.toFixed(2));
}

function ensureTimingSafeEqual(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
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

    if (booking.status !== 'completed') {
      throw new AppError('Booking payment is allowed only after work is completed', 400);
    }

    if (booking.paymentStatus === 'paid') {
      throw new AppError('Booking is already paid', 409);
    }

    clientId = booking.clientId;
    workerId = booking.workerId;
    amount = payload.amount !== undefined ? payload.amount : booking.amount;
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
      throw new AppError('workerId is required when paying for this job', 400);
    }

    await ensureWorker(resolvedWorkerId);

    if (job.assignedWorkerId && getIdValue(job.assignedWorkerId) !== getIdValue(resolvedWorkerId)) {
      throw new AppError('Provided worker does not match assigned worker for this job', 400);
    }

    if (job.status !== 'completed') {
      throw new AppError('Job payment is allowed only after work is completed', 400);
    }

    if (job.paymentStatus === 'paid') {
      throw new AppError('This job is already paid', 409);
    }

    const relatedApplication = await JobApplication.findOne({
      jobId: job._id,
      workerId: resolvedWorkerId,
    }).select('_id status proposedRate');

    if (!relatedApplication) {
      throw new AppError('No matching application found for this job and worker', 400);
    }

    if (!APPLICATION_PAYMENT_READY_STATUSES.has(relatedApplication.status)) {
      throw new AppError('Payment can start only after the worker reaches work completed', 400);
    }

    clientId = job.clientId;
    workerId = resolvedWorkerId;
    amount =
      payload.amount !== undefined
        ? payload.amount
        : Number(relatedApplication.proposedRate || job.budgetMax || job.budgetMin || 0);
  }

  return {
    booking,
    job,
    clientId,
    workerId,
    amount: sanitizeAmount(amount),
  };
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

  return populatePayment(Payment.find(filters).sort({ createdAt: -1 })).limit(Math.min(Number(query.limit) || 20, 50));
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
  const paymentMode = payload.mode === 'cash' ? 'cash' : 'online';
  const targetFilters = booking ? { bookingId: booking._id } : { jobId: job._id };

  const existingActivePayment = await Payment.findOne({
    ...targetFilters,
    status: { $in: ['pending', 'authorized', 'paid'] },
  });

  if (existingActivePayment) {
    throw new AppError('An active payment already exists for this target', 409);
  }

  if (paymentMode === 'cash') {
    const payment = await Payment.create({
      bookingId: booking?._id || null,
      jobId: job?._id || null,
      clientId,
      workerId,
      amount,
      currency: payload.currency ? String(payload.currency).trim().toUpperCase() : 'INR',
      provider: 'cash',
      status: 'paid',
      paidAt: new Date(),
    });

    await syncTargetPaymentStatus({ booking, job, status: 'paid' });
    await markApplicationAsPaid({
      jobId: payment.jobId,
      workerId: payment.workerId,
      changedBy: requester._id,
      changedByRole: requester.role || 'client',
      note: 'Marked as cash payment',
    });

    return getPaymentById(payment._id, requester);
  }

  const razorpay = getRazorpayClient();
  const receiptPrefix = booking ? 'booking' : 'job';
  const receiptId = booking ? booking._id : job._id;
  const receipt = `${receiptPrefix}_${receiptId.toString().slice(-10)}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: payload.currency ? String(payload.currency).trim().toUpperCase() : 'INR',
    receipt,
  });

  const payment = await Payment.create({
    bookingId: booking?._id || null,
    jobId: job?._id || null,
    clientId,
    workerId,
    amount,
    currency: razorpayOrder.currency,
    provider: 'razorpay',
    providerPaymentId: razorpayOrder.id,
    status: 'authorized',
  });

  await syncTargetPaymentStatus({ booking, job, status: 'authorized' });
  const saved = await getPaymentById(payment._id, requester);

  return {
    ...saved.toObject(),
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: env.razorpayKeyId,
  };
}

export async function verifyAndConfirmPayment(paymentId, requester, body) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('razorpayOrderId, razorpayPaymentId and razorpaySignature are required', 400);
  }

  if (!env.razorpayKeySecret) {
    throw new AppError('Razorpay credentials are not configured on this server', 503);
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (!canManagePayment(payment, requester)) {
    throw new AppError('You do not have permission to verify this payment', 403);
  }

  if (payment.status === 'paid') {
    return getPaymentById(payment._id, requester);
  }

  if (payment.providerPaymentId !== razorpayOrderId) {
    throw new AppError('Order id mismatch for this payment', 400);
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (!ensureTimingSafeEqual(expectedSignature, razorpaySignature)) {
    throw new AppError('Payment signature verification failed', 400);
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  await payment.save();

  const booking = payment.bookingId ? await Booking.findById(payment.bookingId) : null;
  const job = payment.jobId ? await Job.findById(payment.jobId) : null;

  await syncTargetPaymentStatus({ booking, job, status: 'paid' });
  await markApplicationAsPaid({
    jobId: payment.jobId,
    workerId: payment.workerId,
    changedBy: payment.clientId,
    changedByRole: 'client',
    note: 'Payment captured',
  });

  return getPaymentById(payment._id, requester);
}

export async function handleRazorpayWebhook(rawBody, signature) {
  const webhookSecret = env.razorpayWebhookSecret || env.razorpayKeySecret;
  if (!webhookSecret) {
    throw new AppError('Razorpay webhook secret is not configured', 503);
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!ensureTimingSafeEqual(expectedSignature, signature)) {
    throw new AppError('Invalid webhook signature', 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new AppError('Invalid webhook payload', 400);
  }

  if (event.event === 'payment.captured') {
    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    if (razorpayOrderId) {
      const payment = await Payment.findOne({ providerPaymentId: razorpayOrderId });

      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.paidAt = new Date();
        await payment.save();

        const booking = payment.bookingId ? await Booking.findById(payment.bookingId) : null;
        const job = payment.jobId ? await Job.findById(payment.jobId) : null;
        await syncTargetPaymentStatus({ booking, job, status: 'paid' });
        await markApplicationAsPaid({
          jobId: payment.jobId,
          workerId: payment.workerId,
          changedBy: payment.clientId,
          changedByRole: 'client',
          note: 'Payment captured by webhook',
        });
      }
    }
  }

  return { received: true };
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

  if (status === 'paid') {
    await markApplicationAsPaid({
      jobId: payment.jobId,
      workerId: payment.workerId,
      changedBy: requester._id,
      changedByRole: requester.role || 'client',
      note: 'Payment marked as paid manually',
    });
  }

  return getPaymentById(payment._id, requester);
}
