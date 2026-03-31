import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findone',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  serverUrl: process.env.SERVER_URL || `http://127.0.0.1:${Number(process.env.PORT || 8000)}`,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxImageSizeBytes: Number(process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024,
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 300),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
};
