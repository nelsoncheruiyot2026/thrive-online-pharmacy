const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// Generate sale number: POS-YYYYMMDD-XXXXX
const generateSaleNumber = () => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `POS-${datePart}-${rand}`;
};

// ─── Search products for POS ───────────────────────────────────────────────
exports.searchProducts = async (req, res) => {
  const { q, barcode } = req.query;

  const where = { isActive: true };

  if (barcode) {
    where.barcode = barcode;
  } else if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      price: true,
      stock: true,
      requiresPrescription: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
    take: 20,
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: products });
};

// ─── Create a new sale (checkout) ─────────────────────────────────────────
exports.createSale = async (req, res) => {
  const {
    items,             // [{ productId, quantity, unitPrice, discount }]
    paymentMethod,     // CASH | MPESA | CARD
    customerName,
    customerPhone,
    mpesaPhone,
    mpesaReceiptNumber,
    cashTendered,
    discount = 0,
    notes,
  } = req.body;

  if (!items || items.length === 0) {
    throw new AppError('Sale must have at least one item', 400);
  }

  // Validate products and stock in a transaction
  const sale = await prisma.$transaction(async (tx) => {
    let subtotal = 0;

    const enrichedItems = [];
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
      if (!product.isActive) throw new AppError(`Product "${product.name}" is no longer active`, 400);
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock}`, 400);
      }

      const itemDiscount = item.discount || 0;
      const lineSubtotal = (Number(product.price) - itemDiscount) * item.quantity;
      subtotal += lineSubtotal;

      enrichedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: itemDiscount,
        subtotal: lineSubtotal,
      });

      // Deduct stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const totalDiscount = Number(discount);
    const tax = 0; // VAT handled externally for now
    const total = subtotal - totalDiscount + tax;

    const changeDue =
      paymentMethod === 'CASH' && cashTendered
        ? Number(cashTendered) - total
        : null;

    const newSale = await tx.sale.create({
      data: {
        saleNumber: generateSaleNumber(),
        cashierId: req.user.id,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal,
        discount: totalDiscount,
        tax,
        total,
        paymentMethod,
        mpesaPhone: mpesaPhone || null,
        mpesaReceiptNumber: mpesaReceiptNumber || null,
        cashTendered: cashTendered ? Number(cashTendered) : null,
        changeDue,
        notes: notes || null,
        items: { create: enrichedItems },
      },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
        cashier: { select: { firstName: true, lastName: true } },
      },
    });

    return newSale;
  });

  res.status(201).json({ success: true, data: sale });
};

// ─── Get a single sale (for receipt reprint) ──────────────────────────────
exports.getSale = async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { saleNumber: req.params.saleNumber },
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true, barcode: true, imageUrl: true } },
        },
      },
      cashier: { select: { firstName: true, lastName: true } },
    },
  });

  if (!sale) throw new AppError('Sale not found', 404);

  res.json({ success: true, data: sale });
};

// ─── List all sales (admin / reports) ─────────────────────────────────────
exports.getAllSales = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    cashierId,
    paymentMethod,
    status,
  } = req.query;

  const where = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (cashierId) where.cashierId = cashierId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (status) where.status = status;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        cashier: { select: { firstName: true, lastName: true } },
        items: { select: { quantity: true, subtotal: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.sale.count({ where }),
  ]);

  res.json({
    success: true,
    data: sales,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// ─── POS summary stats ────────────────────────────────────────────────────
exports.getPOSStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats, weekStats, monthStats, paymentBreakdown, topProducts] =
    await Promise.all([
      // Today's totals
      prisma.sale.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      // This week
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfWeek }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      // This month
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Payment method breakdown (today)
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Top 5 products today
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 5,
      }),
    ]);

  // Enrich top products
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const enrichedTopProducts = topProducts.map((p) => ({
    productId: p.productId,
    name: productMap[p.productId] || 'Unknown',
    quantitySold: p._sum.quantity,
    revenue: p._sum.subtotal,
  }));

  res.json({
    success: true,
    data: {
      today: {
        revenue: todayStats._sum.total || 0,
        transactions: todayStats._count.id,
      },
      week: {
        revenue: weekStats._sum.total || 0,
        transactions: weekStats._count.id,
      },
      month: {
        revenue: monthStats._sum.total || 0,
        transactions: monthStats._count.id,
      },
      paymentBreakdown,
      topProducts: enrichedTopProducts,
    },
  });
};

// ─── Void / refund a sale ─────────────────────────────────────────────────
exports.voidSale = async (req, res) => {
  const { saleNumber } = req.params;
  const { reason } = req.body;

  const sale = await prisma.sale.findUnique({
    where: { saleNumber },
    include: { items: true },
  });

  if (!sale) throw new AppError('Sale not found', 404);
  if (sale.status !== 'COMPLETED') {
    throw new AppError('Only completed sales can be voided', 400);
  }

  // Restore stock and update status
  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.sale.update({
      where: { id: sale.id },
      data: { status: 'VOIDED', notes: reason || 'Voided by admin' },
    });
  });

  res.json({ success: true, message: 'Sale voided and stock restored' });
};
