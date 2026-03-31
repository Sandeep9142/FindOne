import { Router } from 'express';
import {
  addBookingReview,
  createClientBooking,
  editBooking,
  getBooking,
  getBookings,
  patchBookingStatus,
  patchCancelBooking,
} from '../controllers/bookingController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  bookingIdParamsSchema,
  bookingStatusSchema,
  createBookingReviewSchema,
  createBookingSchema,
  listBookingsSchema,
  updateBookingSchema,
} from '../validators/bookingValidators.js';

const router = Router();

router.use(protect);
router.get('/', validateRequest(listBookingsSchema), getBookings);
router.get('/:id', validateRequest(bookingIdParamsSchema), getBooking);
router.post('/', authorize('client', 'admin'), validateRequest(createBookingSchema), createClientBooking);
router.put('/:id', authorize('client', 'admin'), validateRequest(updateBookingSchema), editBooking);
router.patch('/:id/status', validateRequest(bookingStatusSchema), patchBookingStatus);
router.patch('/:id/cancel', validateRequest(bookingIdParamsSchema), patchCancelBooking);
router.post('/:id/reviews', authorize('client', 'admin'), validateRequest(createBookingReviewSchema), addBookingReview);

export default router;
