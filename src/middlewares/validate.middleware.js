import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware for validating incoming requests using Zod schemas.
 * @param {import('zod').ZodSchema} schema - Zod schema (object with optional body, query, params)
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) {
      try {
        req.params = parsed.params;
      } catch {
        Object.assign(req.params, parsed.params);
      }
    }
    if (parsed.query) {
      try {
        req.query = parsed.query;
      } catch {
        Object.assign(req.query, parsed.query);
      }
    }
    req.validated = parsed;

    next();
  } catch (error) {
    if (error.issues) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation Error', formattedErrors));
    }
    next(error);
  }
};

/**
 * Middleware for express-validator validation chains.
 */
export const validateExpressValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation Error', errors.array()));
  }
  next();
};
