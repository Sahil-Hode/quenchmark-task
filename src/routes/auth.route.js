import { Router } from 'express';
import { sendOtp, verifyOtp, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { sendOtpSchema, verifyOtpSchema } from '../validations/auth.validation.js';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', validate(sendOtpSchema), sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

// GET /api/auth/me (Protected)
router.get('/me', authenticate, getMe);

export default router;
