import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Fetch paginated products with search, category/brand filter, and sorting (price low-to-high, etc.)
 */
export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search;
    const category = req.query.category;
    const brand = req.query.brand;
    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== '' ? parseFloat(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? parseFloat(req.query.maxPrice) : undefined;
    const sortBy = req.query.sortBy || 'newest';

    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where = {};

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (category && category.trim() !== '') {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    if (brand && brand.trim() !== '') {
      where.brand = { equals: brand.trim(), mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Build orderBy clause
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' }; // Price low-to-high
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' }; // Price high-to-low
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          productData: products, // Alias so both .products and .productData work seamlessly
          pagination: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
        'Products fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a single product by its ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return res.status(200).json(new ApiResponse(200, product, 'Product details retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct categories and brand counts
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const formatted = categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));

    return res.status(200).json(new ApiResponse(200, formatted, 'Categories fetched'));
  } catch (error) {
    next(error);
  }
};
