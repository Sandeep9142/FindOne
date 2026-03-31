import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function buildRateLimiter(max, message) {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });
}

export const apiRateLimiter = buildRateLimiter(
  env.apiRateLimitMax,
  'Too many requests, please try again later'
);

export const authRateLimiter = buildRateLimiter(
  env.authRateLimitMax,
  'Too many authentication attempts, please try again later'
);
