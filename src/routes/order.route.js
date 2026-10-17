import { Router } from 'express';
import { checkout, getUserOrders, getOrderById } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { checkoutOrderSchema, orderIdParamSchema } from '../validations/order.validation.js';

const router = Router();

// All order actions require user authentication
router.use(authenticate);

// POST /api/orders/checkout (Fake Checkout button hit)
router.post('/checkout', validate(checkoutOrderSchema), checkout);

// GET /api/orders (List user orders)
router.get('/', getUserOrders);

// GET /api/orders/:id (Get order details)
router.get('/:id', validate(orderIdParamSchema), getOrderById);

export default router;
