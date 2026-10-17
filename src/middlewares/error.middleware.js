import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Internal Server Error', errors = [] } = err;

  // Handle errors that aren't instances of ApiError
  if (!(err instanceof ApiError)) {
    statusCode = err.status || 500;
    message = err.message || 'Internal Server Error';
  }

  // Never leak internal database or Prisma engine errors to client
  if (
    typeof message === 'string' &&
    (message.includes('prisma') ||
      message.includes('Prisma') ||
      message.includes('invocation') ||
      message.includes('Unknown field'))
  ) {
    message = 'Unable to complete verification. Please try again.';
  }

  const response = {
    success: false,
    statusCode,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
