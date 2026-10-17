import { Router } from 'express';
import authRouter from './auth.route.js';
import productRouter from './product.route.js';
import cartRouter from './cart.route.js';
import orderRouter from './order.route.js';
import uploadRouter from './upload.route.js';
import healthRouter from './health.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/upload', uploadRouter);
router.use('/health', healthRouter);

export default router;
