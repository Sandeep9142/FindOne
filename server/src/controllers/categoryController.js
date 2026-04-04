import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Category, WorkerProfile } from '../models/index.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const [categories, workerCounts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    WorkerProfile.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', workerCount: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(
    workerCounts.map((item) => [String(item._id), Number(item.workerCount || 0)])
  );

  const categoriesWithWorkerCount = categories.map((category) => ({
    ...category,
    workerCount: countMap.get(String(category._id)) || 0,
  }));

  return sendSuccess(res, {
    message: 'Categories fetched successfully',
    data: categoriesWithWorkerCount,
  });
});
