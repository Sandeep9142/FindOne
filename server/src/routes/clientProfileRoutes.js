import { Router } from 'express';
import { getMyClient, updateMyClient } from '../controllers/profileController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, authorize('client'));
router.get('/profile', getMyClient);
router.put('/profile', updateMyClient);

export default router;
