const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  searchProducts,
  addReview
} = require('../controllers/product.controller');

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/:slug', getProduct);

// Admin routes
router.post('/', authenticate, requireAdmin, upload.array('images', 5), createProduct);
router.put('/:id', authenticate, requireAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

// Reviews
router.post('/:slug/reviews', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().trim(),
  validate
], addReview);

module.exports = router;
