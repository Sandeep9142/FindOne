import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { uploadsRoot } from '../config/paths.js';
import AppError from '../utils/AppError.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function ensureDirectoryExists(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function createStorage(folderName) {
  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      const targetDirectory = path.join(uploadsRoot, folderName);
      ensureDirectoryExists(targetDirectory);
      callback(null, targetDirectory);
    },
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
      const safeBaseName = `${req.user?._id || 'file'}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${safeBaseName}${extension}`);
    },
  });
}

function fileFilter(_req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new AppError('Only image uploads are allowed', 400));
    return;
  }

  callback(null, true);
}

function createUploader(folderName) {
  return multer({
    storage: createStorage(folderName),
    fileFilter,
    limits: {
      fileSize: env.maxImageSizeBytes,
    },
  });
}

export const avatarUpload = createUploader('avatars');
export const portfolioUpload = createUploader('portfolio');
