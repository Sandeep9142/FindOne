import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  createPayment,
  getPaymentById,
  listPayments,
  updatePaymentStatus,
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
    message: 'Payment created successfully',
    data: payment,
  });
});

export const patchPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await updatePaymentStatus(req.params.id, req.user, req.body.status);

  return sendSuccess(res, {
    message: 'Payment status updated successfully',
    data: payment,
  });
});
