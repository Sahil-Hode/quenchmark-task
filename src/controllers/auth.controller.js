import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

/**
 * Send OTP to user's mobile number
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    // Generate 6 digit OTP (default to 123456 in dev/test, or random 6 digit)
    const otp = env.NODE_ENV === 'production' 
      ? Math.floor(100000 + Math.random() * 900000).toString() 
      : '123456';
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user by mobile
    const user = await prisma.user.upsert({
      where: { mobile },
      update: {
        otp,
        otpExpiresAt,
      },
      create: {
        mobile,
        otp,
        otpExpiresAt,
      },
    });

    console.log(`📱 [AUTH] OTP generated for ${mobile}: ${otp}`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          mobile: user.mobile,
          // Return OTP in response for seamless development & testing without SMS provider
          otp,
          expiresIn: '10 minutes',
        },
        'OTP generated and sent successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login / register user
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp, name } = req.body;

    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new ApiError(404, 'No account found with this mobile number. Please request an OTP first.');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new ApiError(400, 'No active OTP request found. Please request a new OTP.');
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new ApiError(400, 'OTP has expired. Please request a new OTP.');
    }

    if (user.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP. Please check the code and try again.');
    }

    // Clear OTP and optionally update name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiresAt: null,
        ...(name && !user.name ? { name } : {}),
      },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Ensure user has a cart created
    await prisma.cart.upsert({
      where: { userId: updatedUser.id },
      update: {},
      create: { userId: updatedUser.id },
    });

    const token = generateToken({
      id: updatedUser.id,
      mobile: updatedUser.mobile,
      role: updatedUser.role,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
          token,
        },
        'Authentication successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        cart: {
          include: {
            items: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    const cartCount = user?.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...user,
          cartCount,
          ordersCount: user?._count?.orders || 0,
        },
        'User profile retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};
