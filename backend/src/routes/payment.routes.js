const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  initiateMpesaPayment,
  checkMpesaStatus,
  getPaymentDetails
} = require('../controllers/payment.controller');

const router = Router();

router.use(authenticate);

router.post('/mpesa/initiate', [
  body('orderId').notEmpty().isUUID().withMessage('Valid order ID required'),
  body('phone').notEmpty().withMessage('Phone number required'),
  validate
], initiateMpesaPayment);

router.get('/mpesa/status/:checkoutRequestId', checkMpesaStatus);
router.get('/orders/:orderId', getPaymentDetails);

module.exports = router;
