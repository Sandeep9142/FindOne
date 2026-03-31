import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { uploadsRoot } from './config/paths.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { apiRateLimiter } from './middleware/securityMiddleware.js';
import apiRouter from './routes/index.js';
import { sendSuccess } from './utils/apiResponse.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsRoot));
app.use('/api', apiRateLimiter);

app.get('/health', (_req, res) => {
  return sendSuccess(res, {
    message: 'FindOne server is running',
    data: {
      environment: env.nodeEnv,
    },
  });
});

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
