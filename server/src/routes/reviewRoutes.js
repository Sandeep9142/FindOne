import { Router } from 'express';
import { getPublicTestimonials } from '../controllers/reviewController.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { listTestimonialsSchema } from '../validators/reviewValidators.js';

const router = Router();

router.get('/testimonials', validateRequest(listTestimonialsSchema), getPublicTestimonials);

export default router;
