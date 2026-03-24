const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');
const cloudinaryService = require('../services/cloudinary.service');

const prisma = new PrismaClient();

const getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    minPrice,
    maxPrice,
    requiresPrescription,
    featured,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(category && { category: { slug: category } }),
    ...(minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) })
      }
    },
    ...(requiresPrescription !== undefined && {
      requiresPrescription: requiresPrescription === 'true'
    }),
    ...(featured === 'true' && { isFeatured: true })
  };

  const validSortFields = ['createdAt', 'price', 'name'];
  const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortField]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true } }
      }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

const getProduct = async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        where: { isVisible: true },
        include: {
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: { select: { reviews: true } }
    }
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Calculate average rating
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  res.json({
    success: true,
    data: { ...product, avgRating }
  });
};

const createProduct = async (req, res) => {
  const {
    name, description, shortDescription, price, compareAtPrice,
    sku, barcode, stock, lowStockThreshold, requiresPrescription,
    isFeatured, categoryId, dosage, manufacturer, expiryDate
  } = req.body;

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    + '-' + Date.now();

  let imageUrl = null;
  let images = [];

  if (req.files?.length > 0) {
    const uploadResults = await Promise.all(
      req.files.map(file => cloudinaryService.uploadImage(file, 'products'))
    );
    imageUrl = uploadResults[0]?.url;
    images = uploadResults.map(r => r.url);
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      shortDescription,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      sku,
      barcode,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      categoryId,
      imageUrl,
      images,
      dosage,
      manufacturer,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    },
    include: { category: true }
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found', 404);

  const updateData = { ...req.body };
  if (updateData.price) updateData.price = parseFloat(updateData.price);
  if (updateData.compareAtPrice) updateData.compareAtPrice = parseFloat(updateData.compareAtPrice);
  if (updateData.stock) updateData.stock = parseInt(updateData.stock);
  if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
  if (updateData.requiresPrescription !== undefined) {
    updateData.requiresPrescription = updateData.requiresPrescription === 'true' || updateData.requiresPrescription === true;
  }

  if (req.files?.length > 0) {
    const uploadResults = await Promise.all(
      req.files.map(file => cloudinaryService.uploadImage(file, 'products'))
    );
    updateData.imageUrl = uploadResults[0]?.url;
    updateData.images = uploadResults.map(r => r.url);
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true }
  });

  res.json({ success: true, message: 'Product updated', data: product });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({ success: true, message: 'Product deleted successfully' });
};

const getFeaturedProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: products });
};

const searchProducts = async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    },
    take: parseInt(limit),
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      imageUrl: true,
      requiresPrescription: true,
      stock: true,
      category: { select: { name: true } }
    }
  });

  res.json({ success: true, data: products });
};

const addReview = async (req, res) => {
  const { slug } = req.params;
  const { rating, comment } = req.body;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw new AppError('Product not found', 404);

  // Check if user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { userId: req.user.id, status: 'DELIVERED' }
    }
  });

  if (!purchased) {
    throw new AppError('You can only review products you have purchased', 403);
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: req.user.id, productId: product.id } },
    update: { rating: parseInt(rating), comment },
    create: {
      userId: req.user.id,
      productId: product.id,
      rating: parseInt(rating),
      comment
    },
    include: { user: { select: { firstName: true, lastName: true } } }
  });

  res.status(201).json({ success: true, message: 'Review submitted', data: review });
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  searchProducts,
  addReview
};
