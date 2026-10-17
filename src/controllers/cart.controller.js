import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Helper to calculate dynamic totals for cart items
 */
export const calculateCartTotals = (items = []) => {
  let subtotal = 0;
  let totalSavings = 0;
  let totalQuantity = 0;

  const formattedItems = items.map((item) => {
    const unitPrice = item.product.price;
    const originalPrice = item.product.originalPrice || unitPrice;
    const itemTotal = unitPrice * item.quantity;
    const itemSavings = (originalPrice - unitPrice) * item.quantity;

    subtotal += itemTotal;
    totalSavings += Math.max(0, itemSavings);
    totalQuantity += item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      itemTotal,
      product: item.product,
    };
  });

  // Dynamic calculations:
  // Tax: 18% GST standard
  const tax = subtotal > 0 ? Math.round(subtotal * 0.18 * 100) / 100 : 0;
  // Shipping: Free if subtotal > ₹1,500, else ₹99 (or 0 if empty)
  const shippingFee = subtotal > 1500 || subtotal === 0 ? 0 : 99;
  const totalAmount = Math.round((subtotal + tax + shippingFee) * 100) / 100;

  return {
    items: formattedItems,
    summary: {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      shippingFee,
      totalAmount,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalQuantity,
      isFreeShippingEligible: subtotal > 1500,
    },
  };
};

/**
 * Helper to ensure a user has a cart in DB
 */
const getOrCreateUserCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  return cart;
};

/**
 * Get user's cart with dynamic total calculation
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateUserCart(userId);
    const cartData = calculateCartTotals(cart.items);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cartId: cart.id,
          ...cartData,
        },
        'Cart fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add a product to cart (or increment quantity if already present)
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (product.stock < quantity) {
      throw new ApiError(400, `Only ${product.stock} units available in stock`);
    }

    const cart = await getOrCreateUserCart(userId);

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new ApiError(400, `Cannot add more. Maximum available stock is ${product.stock}`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    const updatedCart = await getOrCreateUserCart(userId);
    const cartData = calculateCartTotals(updatedCart.items);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cartId: updatedCart.id,
          ...cartData,
        },
        'Item added to cart successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update quantity of an item in cart
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await getOrCreateUserCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!existingItem) {
      throw new ApiError(404, 'Item not found in cart');
    }

    if (quantity <= 0) {
      // Remove item if quantity is zero or negative
      await prisma.cartItem.delete({
        where: { id: existingItem.id },
      });
    } else {
      if (existingItem.product.stock < quantity) {
        throw new ApiError(400, `Only ${existingItem.product.stock} units available in stock`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    }

    const updatedCart = await getOrCreateUserCart(userId);
    const cartData = calculateCartTotals(updatedCart.items);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cartId: updatedCart.id,
          ...cartData,
        },
        'Cart updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await getOrCreateUserCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      throw new ApiError(404, 'Product not found in cart');
    }

    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });

    const updatedCart = await getOrCreateUserCart(userId);
    const cartData = calculateCartTotals(updatedCart.items);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cartId: updatedCart.id,
          ...cartData,
        },
        'Product removed from cart'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all items from cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateUserCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cartId: cart.id,
          items: [],
          summary: {
            subtotal: 0,
            tax: 0,
            shippingFee: 0,
            totalAmount: 0,
            totalSavings: 0,
            totalQuantity: 0,
            isFreeShippingEligible: false,
          },
        },
        'Cart cleared successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};
