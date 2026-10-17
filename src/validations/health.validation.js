import { z } from 'zod';

export const healthEchoSchema = z.object({
  query: z.object({
    echo: z.string().optional(),
  }),
});

export const sampleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
  }),
});
