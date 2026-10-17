import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { calculateCartTotals } from './cart.controller.js';

/**
 * Fake Checkout: places an order in DB from user's cart and empties cart
 */
export const checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod = 'FAKE_CHECKOUT' } = req.body;

    // 1. Get user cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Your cart is empty. Add products before checking out.');
    }

    // 2. Validate stock for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${item.product.title}". Only ${item.product.stock} left in stock.`
        );
      }
    }

    // 3. Calculate dynamic totals
    const { summary } = calculateCartTotals(cart.items);

    // 4. Generate order number
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    // 5. Create Order with OrderItems snapshot
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: summary.subtotal,
        tax: summary.tax,
        shippingFee: summary.shippingFee,
        totalAmount: summary.totalAmount,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod,
        shippingAddress:
          typeof shippingAddress === 'string'
            ? {
                fullName: req.user.name || 'Demo Customer',
                mobile: req.user.mobile,
                addressLine: shippingAddress,
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560001',
              }
            : shippingAddress || {
                fullName: req.user.name || 'Demo Customer',
                mobile: req.user.mobile,
                addressLine: '123 Tech Avenue, Silicon Valley',
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560001',
              },
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 6. Reduce stock for ordered items
    await Promise.all(
      cart.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      )
    );

    // 7. Clear user cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        newOrder,
        'Order placed successfully! Fake checkout completed.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders placed by the authenticated user
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,
          count: orders.length,
        },
        'User orders fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'You do not have permission to view this order');
    }

    return res.status(200).json(
      new ApiResponse(200, order, 'Order details retrieved')
    );
  } catch (error) {
    next(error);
  }
};
