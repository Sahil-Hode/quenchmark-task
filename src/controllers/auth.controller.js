import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { smsService } from '../services/sms.service.js';

/**
 * Send OTP to user's mobile number
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { mobile, otp: customOtp } = req.body;

    // Generate 6 digit OTP (use customOtp if provided, else generate random 6 digits)
    const otp = customOtp ? String(customOtp).trim() : Math.floor(100000 + Math.random() * 900000).toString();
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

    // Dispatch OTP via Fast2SMS
    const smsResult = await smsService.sendOtp(mobile, otp);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          mobile: user.mobile,
          expiresIn: '10 minutes',
          smsSent: smsResult.success,
          provider: smsResult.provider || 'simulated',
          // Returned in development for quick testing/debugging
          ...(env.NODE_ENV === 'development' && { otp }),
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

/**
 * Update current user profile and address
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, dob, gender, address, isOnboarded } = req.body;

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name: name ? String(name).trim() : null }),
          ...(email !== undefined && { email: email ? String(email).trim() : null }),
          ...(dob !== undefined && { dob: dob ? String(dob).trim() : null }),
          ...(gender !== undefined && { gender: gender ? String(gender).trim() : null }),
          ...(address !== undefined && { address }),
          ...(isOnboarded !== undefined ? { isOnboarded } : { isOnboarded: true }),
        },
      });
    } catch {
      // Direct Supabase REST API fallback
      const supabaseUrl = `${env.SUPABASE_URL || 'https://xzgxfzkmzfqoiikpvmif.supabase.co'}/rest/v1/users?id=eq.${userId}`;
      const supabaseKey = env.SUPABASE_SERVICE_KEY;

      const directRes = await fetch(supabaseUrl, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          ...(name !== undefined && { name: name ? String(name).trim() : null }),
          ...(email !== undefined && { email: email ? String(email).trim() : null }),
          ...(dob !== undefined && { dob: dob ? String(dob).trim() : null }),
          ...(gender !== undefined && { gender: gender ? String(gender).trim() : null }),
          ...(address !== undefined && { address }),
          ...(isOnboarded !== undefined ? { isOnboarded } : { isOnboarded: true }),
        }),
      });

      const rows = await directRes.json();
      updatedUser = Array.isArray(rows) && rows[0] ? rows[0] : { id: userId, name, email, dob, gender, address, isOnboarded: true };
    }

    return res.status(200).json(
      new ApiResponse(200, { user: updatedUser }, 'Profile and address updated successfully')
    );
  } catch (error) {
    next(error);
  }
};
