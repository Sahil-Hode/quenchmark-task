import { Router } from 'express';
import { getProducts, getProductById, getCategories } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getProductsSchema, productIdParamSchema } from '../validations/product.validation.js';

const router = Router();

// GET /api/products (Paginated, Search, Filters, Sorting)
router.get('/', validate(getProductsSchema), getProducts);

// GET /api/products/categories
router.get('/categories', getCategories);

// GET /api/products/:id
router.get('/:id', validate(productIdParamSchema), getProductById);

export default router;
