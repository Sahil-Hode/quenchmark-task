import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    mobile: z
      .string()
      .trim()
      .min(10, 'Mobile number must be at least 10 digits')
      .max(15, 'Mobile number is too long')
      .regex(/^[0-9+]+$/, 'Mobile number must contain digits only'),
    otp: z.string().optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    mobile: z
      .string()
      .trim()
      .min(10, 'Mobile number must be at least 10 digits')
      .max(15, 'Mobile number is too long'),
    otp: z
      .string()
      .trim()
      .min(4, 'OTP must be at least 4 digits')
      .max(6, 'OTP must be at most 6 digits'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  }),
});
