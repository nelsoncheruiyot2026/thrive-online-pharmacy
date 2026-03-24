const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/order.controller');

const router = Router();

router.use(authenticate);

// Customer routes
router.post('/', [
  body('paymentMethod').isIn(['MPESA', 'CARD', 'CASH_ON_DELIVERY']).withMessage('Invalid payment method'),
  body('addressId').optional().isUUID(),
  validate
], createOrder);

router.get('/', getOrders);
router.get('/:orderNumber', getOrder);
router.post('/:orderNumber/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', requireAdmin, getAllOrders);
router.put('/admin/:id/status', requireAdmin, [
  body('status').notEmpty().withMessage('Status required'),
  validate
], updateOrderStatus);

module.exports = router;
