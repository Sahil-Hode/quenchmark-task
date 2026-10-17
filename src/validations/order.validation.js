import { z } from 'zod';

export const checkoutOrderSchema = z.object({
  body: z.object({
    shippingAddress: z
      .union([
        z.string(),
        z.object({
          fullName: z.string().optional(),
          addressLine: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
        }),
      ])
      .optional(),
    paymentMethod: z.string().optional().default('FAKE_CHECKOUT'),
    notes: z.string().optional(),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});
