import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  cancelBooking,
  createBooking,
  createBookingReview,
  getBookingById,
  listBookings,
  updateBooking,
  updateBookingStatus,
} from '../services/bookingService.js';

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await listBookings(req.user, req.query);

  return sendSuccess(res, {
    message: 'Bookings fetched successfully',
    data: bookings,
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Booking fetched successfully',
    data: booking,
  });
});

export const createClientBooking = asyncHandler(async (req, res) => {
  const booking = await createBooking(req.user._id, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Booking created successfully',
    data: booking,
  });
});

export const editBooking = asyncHandler(async (req, res) => {
  const booking = await updateBooking(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    message: 'Booking updated successfully',
    data: booking,
  });
});

export const patchBookingStatus = asyncHandler(async (req, res) => {
  const booking = await updateBookingStatus(req.params.id, req.user, req.body.status);

  return sendSuccess(res, {
    message: 'Booking status updated successfully',
    data: booking,
  });
});

export const patchCancelBooking = asyncHandler(async (req, res) => {
  const booking = await cancelBooking(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

export const addBookingReview = asyncHandler(async (req, res) => {
  const review = await createBookingReview(req.params.id, req.user, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Booking review created successfully',
    data: review,
  });
});
