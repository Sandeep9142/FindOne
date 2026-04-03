import { Router } from 'express';
import { env } from '../config/env.js';
import { getMe, login, logout, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/securityMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

const router = Router();

function redirectToClientAuthPage(path) {
  return (_req, res) => res.redirect(302, `${env.clientUrl}${path}`);
}

router.get('/login', redirectToClientAuthPage('/login'));
router.get('/register', redirectToClientAuthPage('/register'));
router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
