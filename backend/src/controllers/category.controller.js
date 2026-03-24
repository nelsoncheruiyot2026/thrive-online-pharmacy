const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: { where: { isActive: true } } } }
    }
  });

  res.json({ success: true, data: categories });
};

const getCategory = async (req, res) => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: { where: { isActive: true } } } }
    }
  });

  if (!category) throw new AppError('Category not found', 404);

  res.json({ success: true, data: category });
};

const createCategory = async (req, res) => {
  const { name, description, imageUrl } = req.body;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  const category = await prisma.category.create({
    data: { name, slug, description, imageUrl }
  });

  res.status(201).json({ success: true, message: 'Category created', data: category });
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, isActive } = req.body;

  const updateData = { description, imageUrl, isActive };
  if (name) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData
  });

  res.json({ success: true, message: 'Category updated', data: category });
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  const productCount = await prisma.product.count({ where: { categoryId: id } });

  if (productCount > 0) {
    throw new AppError('Cannot delete category with existing products', 400);
  }

  await prisma.category.update({ where: { id }, data: { isActive: false } });

  res.json({ success: true, message: 'Category deleted' });
};

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
