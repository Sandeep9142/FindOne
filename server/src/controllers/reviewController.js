import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { listPublicTestimonials } from '../services/reviewService.js';

export const getPublicTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await listPublicTestimonials(req.query);

  return sendSuccess(res, {
    message: 'Testimonials fetched successfully',
    data: testimonials,
  });
});
