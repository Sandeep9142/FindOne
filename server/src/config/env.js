import dotenv from 'dotenv';

dotenv.config();

const clientUrlsFromEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL || '';
const parsedClientUrls = clientUrlsFromEnv
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const defaultClientUrls = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
const clientUrls = parsedClientUrls.length > 0 ? parsedClientUrls : defaultClientUrls;

export const env = {
  port: Number(process.env.PORT || 8000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrls[0],
  clientUrls,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findone',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  serverUrl: process.env.SERVER_URL || `http://127.0.0.1:${Number(process.env.PORT || 8000)}`,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxImageSizeBytes: Number(process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024,
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 300),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};
