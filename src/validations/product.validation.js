import { z } from 'zod';

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional().default('newest'),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
});
