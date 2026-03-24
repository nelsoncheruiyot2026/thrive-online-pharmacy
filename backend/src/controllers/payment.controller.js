const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');
const mpesaService = require('../services/mpesa.service');

const prisma = new PrismaClient();

// Initiate M-Pesa STK Push
const initiateMpesaPayment = async (req, res) => {
  const { orderId, phone } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user.id }
  });

  if (!order) throw new AppError('Order not found', 404);

  if (!['PENDING_PAYMENT', 'PRESCRIPTION_APPROVED'].includes(order.status)) {
    throw new AppError('Payment not required for this order status', 400);
  }

  // Format phone number (Kenya: 07... -> 2547...)
  const formattedPhone = phone
    .replace(/\D/g, '')
    .replace(/^0/, '254')
    .replace(/^(\+?254)/, '254');

  if (!/^2547\d{8}$/.test(formattedPhone)) {
    throw new AppError('Invalid Kenyan phone number. Use format 07XXXXXXXX', 400);
  }

  const amount = Math.ceil(parseFloat(order.total));

  const stkResponse = await mpesaService.initiateSTKPush({
    phone: formattedPhone,
    amount,
    orderId: order.id,
    orderNumber: order.orderNumber
  });

  // Create or update payment record
  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: {
      mpesaPhone: formattedPhone,
      mpesaCheckoutId: stkResponse.CheckoutRequestID,
      status: 'PENDING'
    },
    create: {
      orderId: order.id,
      method: 'MPESA',
      amount: order.total,
      mpesaPhone: formattedPhone,
      mpesaCheckoutId: stkResponse.CheckoutRequestID,
      status: 'PENDING'
    }
  });

  res.json({
    success: true,
    message: 'STK Push sent to your phone. Enter your M-Pesa PIN to complete payment.',
    data: {
      checkoutRequestId: stkResponse.CheckoutRequestID,
      customerMessage: stkResponse.CustomerMessage
    }
  });
};

// Check M-Pesa payment status
const checkMpesaStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;

  const payment = await prisma.payment.findFirst({
    where: { mpesaCheckoutId: checkoutRequestId },
    include: { order: true }
  });

  if (!payment) throw new AppError('Payment not found', 404);

  // Check ownership
  if (payment.order.userId !== req.user.id) {
    throw new AppError('Access denied', 403);
  }

  // Query STK Push status from Safaricom
  try {
    const statusResponse = await mpesaService.querySTKPushStatus(checkoutRequestId);

    if (statusResponse.ResultCode === 0) {
      // Payment successful - update if not already done
      if (payment.status !== 'COMPLETED') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              mpesaResultCode: 0,
              mpesaResultDesc: 'Payment completed successfully',
              paidAt: new Date()
            }
          });
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'PAYMENT_CONFIRMED' }
          });
        });
      }
    } else if (statusResponse.ResultCode) {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          mpesaResultCode: statusResponse.ResultCode,
          mpesaResultDesc: statusResponse.ResultDesc
        }
      });
    }
  } catch (err) {
    console.error('STK status query failed:', err);
  }

  const updatedPayment = await prisma.payment.findUnique({
    where: { id: payment.id }
  });

  res.json({
    success: true,
    data: {
      status: updatedPayment.status,
      paidAt: updatedPayment.paidAt,
      receiptNumber: updatedPayment.mpesaReceiptNumber
    }
  });
};

// M-Pesa callback handler (called by Safaricom)
const mpesaCallback = async (req, res) => {
  const callbackData = req.body;

  try {
    const {
      Body: {
        stkCallback: {
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata
        }
      }
    } = callbackData;

    const payment = await prisma.payment.findFirst({
      where: { mpesaCheckoutId: CheckoutRequestID }
    });

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Extract M-Pesa receipt number and other details
      const metadata = CallbackMetadata?.Item || [];
      const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            mpesaReceiptNumber: receiptNumber,
            mpesaResultCode: ResultCode,
            mpesaResultDesc: ResultDesc,
            paidAt: new Date()
          }
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PAYMENT_CONFIRMED' }
        });
      });

      console.log(`Payment successful: ${receiptNumber} for order ${payment.orderId}`);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          mpesaResultCode: ResultCode,
          mpesaResultDesc: ResultDesc
        }
      });

      console.log(`Payment failed: ${ResultDesc} for order ${payment.orderId}`);
    }
  } catch (err) {
    console.error('M-Pesa callback error:', err);
  }

  // Always respond with success to Safaricom
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

// Get payment details for an order
const getPaymentDetails = async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(req.user.role === 'CUSTOMER' && { userId: req.user.id })
    }
  });

  if (!order) throw new AppError('Order not found', 404);

  const payment = await prisma.payment.findUnique({
    where: { orderId }
  });

  res.json({ success: true, data: payment });
};

module.exports = {
  initiateMpesaPayment,
  checkMpesaStatus,
  mpesaCallback,
  getPaymentDetails
};
