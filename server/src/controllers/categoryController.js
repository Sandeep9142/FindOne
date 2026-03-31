import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Category } from '../models/index.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

  return sendSuccess(res, {
    message: 'Categories fetched successfully',
    data: categories,
  });
});
