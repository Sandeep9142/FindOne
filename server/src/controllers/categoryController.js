import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { Category, WorkerProfile } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureCategoriesExist() {
  const existingCount = await Category.countDocuments({ isActive: true });
  if (existingCount > 0) {
    return;
  }

  const seedPath = path.resolve(__dirname, '../../../database/seeds/categories.json');
  const raw = await fs.readFile(seedPath, 'utf-8');
  const seedCategories = JSON.parse(raw);

  await Promise.all(
    seedCategories.map((category) =>
      Category.updateOne({ slug: category.slug }, { $set: category }, { upsert: true })
    )
  );
}

export const getCategories = asyncHandler(async (_req, res) => {
  await ensureCategoriesExist();

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
