import { Router } from 'express';
import { getHealth, testValidation } from '../controllers/health.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { healthEchoSchema, sampleValidationSchema } from '../validations/health.validation.js';

const router = Router();

// GET /api/health?echo=hello
router.get('/', validate(healthEchoSchema), getHealth);

// POST /api/health/test-validation
router.post('/test-validation', validate(sampleValidationSchema), testValidation);

export default router;
