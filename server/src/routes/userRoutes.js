import { Router } from 'express';
import { getMeProfile, updateMeProfile, uploadAvatar } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { avatarUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);
router.get('/me', getMeProfile);
router.put('/me', updateMeProfile);
router.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
