import mongoose from 'mongoose';
import multer from 'multer';
import AppError from '../utils/AppError.js';
import { sendError } from '../utils/apiResponse.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid value for ${error.path}`,
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large'
        : 'File upload failed';

    return sendError(res, {
      statusCode: 400,
      message,
    });
  }

  if (error?.code === 11000) {
    return sendError(res, {
      statusCode: 409,
      message: 'Duplicate value detected',
      errors: error.keyValue,
    });
  }

  console.error(error);

  return sendError(res, {
    statusCode: 500,
    message: 'Internal server error',
  });
}
