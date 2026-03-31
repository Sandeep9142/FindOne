import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import connectDatabase from '../config/database.js';
import { Category } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedCategories() {
  await connectDatabase();

  const seedPath = path.resolve(__dirname, '../../../database/seeds/categories.json');
  const raw = await fs.readFile(seedPath, 'utf-8');
  const categories = JSON.parse(raw);

  for (const category of categories) {
    await Category.updateOne({ slug: category.slug }, { $set: category }, { upsert: true });
  }

  console.log(`Seeded ${categories.length} categories`);
  process.exit(0);
}

seedCategories().catch((error) => {
  console.error('Failed to seed categories', error);
  process.exit(1);
});
