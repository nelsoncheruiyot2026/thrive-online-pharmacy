const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');
const { generateOrderNumber } = require('../utils/helpers');
const notificationService = require('../services/notification.service');

const prisma = new PrismaClient();

const createOrder = async (req, res) => {
  const { addressId, paymentMethod, notes } = req.body;

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  // Validate stock for all items
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new AppError(`${item.product.name} is no longer available`, 400);
    }
    if (item.product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
        400
      );
    }
  }

  // Check if prescription required
  const requiresPrescription = cart.items.some(item => item.product.requiresPrescription);

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const deliveryFee = subtotal >= 5000 ? 0 : 200; // Free delivery over KES 5,000
  const total = subtotal + deliveryFee;

  // Create order with items in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        addressId,
        status: requiresPrescription ? 'PENDING_PRESCRIPTION' : 'PENDING_PAYMENT',
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        notes,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: parseFloat(item.product.price) * item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } }
          }
        },
        address: true
      }
    });

    // Deduct stock
    await Promise.all(
      cart.items.map(item =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      )
    );

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  // Send order confirmation
  try {
    await notificationService.sendOrderConfirmation(req.user, order);
  } catch (err) {
    console.error('Failed to send order confirmation:', err);
  }

  res.status(201).json({
    success: true,
    message: requiresPrescription
      ? 'Order created. Please upload your prescription to proceed.'
      : 'Order created successfully',
    data: order
  });
};

const getOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    userId: req.user.id,
    ...(status && { status })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } }
          }
        },
        payment: { select: { status: true, paidAt: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

const getOrder = async (req, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      ...(req.user.role === 'CUSTOMER' && { userId: req.user.id })
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true, slug: true }
          }
        }
      },
      address: true,
      payment: true,
      prescription: true,
      user: { select: { firstName: true, lastName: true, email: true, phone: true } }
    }
  });

  if (!order) throw new AppError('Order not found', 404);

  res.json({ success: true, data: order });
};

const cancelOrder = async (req, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: req.user.id }
  });

  if (!order) throw new AppError('Order not found', 404);

  if (!['PENDING_PAYMENT', 'PENDING_PRESCRIPTION'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  // Restore stock
  await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });

    await Promise.all(
      items.map(item =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })
      )
    );

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' }
    });
  });

  res.json({ success: true, message: 'Order cancelled successfully' });
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
        payment: { select: { status: true, method: true } },
        prescription: { select: { status: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, estimatedDelivery } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError('Order not found', 404);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) })
    },
    include: {
      user: { select: { email: true, phone: true, firstName: true } }
    }
  });

  // Send status update notification
  try {
    await notificationService.sendOrderStatusUpdate(updated.user, updated);
  } catch (err) {
    console.error('Notification failed:', err);
  }

  res.json({ success: true, message: 'Order status updated', data: updated });
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
};
