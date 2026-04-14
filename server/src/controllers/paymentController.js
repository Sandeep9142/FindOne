import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  createPayment,
  getPaymentById,
  handleRazorpayWebhook,
  listPayments,
  updatePaymentStatus,
  verifyAndConfirmPayment,
} from '../services/paymentService.js';

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await listPayments(req.user, req.query);

  return sendSuccess(res, {
    message: 'Payments fetched successfully',
    data: payments,
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await getPaymentById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Payment fetched successfully',
    data: payment,
  });
});

export const createNewPayment = asyncHandler(async (req, res) => {
  const payment = await createPayment(req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment order created. Complete checkout to confirm.',
    data: payment,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await verifyAndConfirmPayment(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    message: 'Payment verified and confirmed successfully',
    data: payment,
  });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] || '';

  // rawBody is populated by express.raw() middleware mounted only on this route
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const result = await handleRazorpayWebhook(rawBody, signature);

  return sendSuccess(res, {
    message: 'Webhook received',
    data: result,
  });
});

export const patchPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await updatePaymentStatus(req.params.id, req.user, req.body.status);

  return sendSuccess(res, {
    message: 'Payment status updated successfully',
    data: payment,
  });
});
