import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemParamSchema,
} from '../validations/cart.validation.js';

const router = Router();

// All cart actions require user authentication
router.use(authenticate);

// GET /api/cart
router.get('/', getCart);

// POST /api/cart/add
router.post('/add', validate(addToCartSchema), addToCart);

// PATCH /api/cart/update
router.patch('/update', validate(updateCartItemSchema), updateCartItem);

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', validate(removeCartItemParamSchema), removeFromCart);

// DELETE /api/cart/clear
router.delete('/clear', clearCart);

export default router;
