import path from 'node:path';
import { env } from '../config/env.js';
import { uploadsRoot } from '../config/paths.js';

export function toPublicUploadUrl(filePath) {
  const relativePath = path.relative(uploadsRoot, filePath).split(path.sep).join('/');
  return `${env.serverUrl}/uploads/${relativePath}`;
}
