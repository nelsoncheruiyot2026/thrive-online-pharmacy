const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);

router.post('/items', [
  body('productId').notEmpty().withMessage('Product ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validate
], addToCart);

router.put('/items/:itemId', [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  validate
], updateCartItem);

router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
