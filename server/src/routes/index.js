import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';
import authRoutes from './authRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import clientProfileRoutes from './clientProfileRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import jobRoutes from './jobRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import userRoutes from './userRoutes.js';
import workerRoutes from './workerRoutes.js';

const router = Router();

router.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'FindOne API v1',
    data: {
      version: 'v1',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/categories', categoryRoutes);
router.use('/conversations', conversationRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/workers', workerRoutes);
router.use('/clients', clientProfileRoutes);
router.use('/jobs', jobRoutes);

export default router;
