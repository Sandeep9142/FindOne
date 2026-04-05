import { Router } from 'express';
import {
  addWorkerReview,
  getMyWorker,
  getWorker,
  getWorkerReviewList,
  getWorkers,
  searchWorkers,
  uploadAvatar,
  uploadWorkerPortfolio,
  updateMyWorker,
} from '../controllers/profileController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { avatarUpload, portfolioUpload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { createWorkerReviewSchema } from '../validators/reviewValidators.js';

const router = Router();

router.get('/profile/me', protect, authorize('worker'), getMyWorker);
router.put('/profile', protect, authorize('worker'), updateMyWorker);
router.post('/avatar', protect, authorize('worker'), avatarUpload.single('avatar'), uploadAvatar);
router.post('/portfolio', protect, authorize('worker'), portfolioUpload.array('images', 6), uploadWorkerPortfolio);
router.get('/', getWorkers);
router.get('/search', searchWorkers);
router.get('/:id', getWorker);
router.post('/:id/reviews', protect, authorize('client', 'admin'), validateRequest(createWorkerReviewSchema), addWorkerReview);
router.get('/:id/reviews', getWorkerReviewList);

export default router;
