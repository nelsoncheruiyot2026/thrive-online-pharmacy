const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dashboard stats
const getDashboardStats = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    monthlyOrders,
    lastMonthOrders,
    totalRevenue,
    monthlyRevenue,
    totalCustomers,
    newCustomers,
    pendingPrescriptions,
    pendingOrders,
    lowStockProducts
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({
      where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } }
    }),
    prisma.prescription.count({ where: { status: 'PENDING' } }),
    prisma.order.count({
      where: { status: { in: ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSING'] } }
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 10 } },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
      take: 10
    })
  ]);

  // Order status breakdown
  const orderStatusBreakdown = await prisma.order.groupBy({
    by: ['status'],
    _count: true
  });

  // Revenue by day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPayments = await prisma.payment.findMany({
    where: { status: 'COMPLETED', paidAt: { gte: sevenDaysAgo } },
    select: { amount: true, paidAt: true }
  });

  // Group revenue by day
  const revenueByDay = {};
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().split('T')[0];
    revenueByDay[key] = 0;
  }

  recentPayments.forEach(payment => {
    if (payment.paidAt) {
      const key = payment.paidAt.toISOString().split('T')[0];
      if (revenueByDay[key] !== undefined) {
        revenueByDay[key] += parseFloat(payment.amount);
      }
    }
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        monthlyOrders,
        lastMonthOrders,
        orderGrowth: lastMonthOrders > 0
          ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
          : 100,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        totalCustomers,
        newCustomers,
        pendingPrescriptions,
        pendingOrders
      },
      orderStatusBreakdown: orderStatusBreakdown.map(s => ({
        status: s.status,
        count: s._count
      })),
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue
      })),
      lowStockProducts
    }
  });
};

// Get all customers
const getCustomers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    role: 'CUSTOMER',
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    })
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

// Toggle customer status
const toggleCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { PrismaClient: PC } = require('@prisma/client');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true, email: true }
  });

  res.json({
    success: true,
    message: `User ${updated.isActive ? 'activated' : 'deactivated'}`,
    data: updated
  });
};

module.exports = { getDashboardStats, getCustomers, toggleCustomerStatus };
