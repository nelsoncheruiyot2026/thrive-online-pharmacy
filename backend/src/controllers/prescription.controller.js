const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');
const cloudinaryService = require('../services/cloudinary.service');

const prisma = new PrismaClient();

const uploadPrescription = async (req, res) => {
  const { orderId } = req.params;

  if (!req.file) {
    throw new AppError('Prescription image is required', 400);
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user.id }
  });

  if (!order) throw new AppError('Order not found', 404);

  if (!['PENDING_PRESCRIPTION', 'PRESCRIPTION_REJECTED'].includes(order.status)) {
    throw new AppError('Prescription upload not required for this order', 400);
  }

  // Upload to Cloudinary
  const uploadResult = await cloudinaryService.uploadImage(req.file, 'prescriptions');

  // Upsert prescription
  const prescription = await prisma.prescription.upsert({
    where: { orderId },
    update: {
      imageUrl: uploadResult.url,
      status: 'PENDING',
      reviewedBy: null,
      reviewNotes: null,
      reviewedAt: null
    },
    create: {
      orderId,
      userId: req.user.id,
      imageUrl: uploadResult.url
    }
  });

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PENDING_PRESCRIPTION' }
  });

  res.status(201).json({
    success: true,
    message: 'Prescription uploaded. Our pharmacist will review it shortly.',
    data: prescription
  });
};

const getPrescription = async (req, res) => {
  const { orderId } = req.params;

  const prescription = await prisma.prescription.findUnique({
    where: { orderId },
    include: {
      order: { select: { orderNumber: true, status: true } }
    }
  });

  if (!prescription) throw new AppError('Prescription not found', 404);

  // Check access
  if (req.user.role === 'CUSTOMER' && prescription.userId !== req.user.id) {
    throw new AppError('Access denied', 403);
  }

  res.json({ success: true, data: prescription });
};

// Admin: Get all prescriptions
const getAllPrescriptions = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { ...(status && { status }) };

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        order: {
          select: {
            orderNumber: true,
            total: true,
            items: {
              include: { product: { select: { name: true, requiresPrescription: true } } }
            }
          }
        }
      }
    }),
    prisma.prescription.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

// Admin: Review prescription
const reviewPrescription = async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Status must be APPROVED or REJECTED', 400);
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: { order: true }
  });

  if (!prescription) throw new AppError('Prescription not found', 404);

  await prisma.$transaction(async (tx) => {
    await tx.prescription.update({
      where: { id },
      data: {
        status,
        reviewedBy: req.user.id,
        reviewNotes,
        reviewedAt: new Date()
      }
    });

    const newOrderStatus = status === 'APPROVED'
      ? 'PRESCRIPTION_APPROVED'
      : 'PRESCRIPTION_REJECTED';

    await tx.order.update({
      where: { id: prescription.orderId },
      data: { status: newOrderStatus }
    });
  });

  res.json({
    success: true,
    message: `Prescription ${status.toLowerCase()} successfully`
  });
};

module.exports = {
  uploadPrescription,
  getPrescription,
  getAllPrescriptions,
  reviewPrescription
};
