const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// All POS routes require authentication (admin or pharmacist)
router.use(authenticate);
router.use(requireAdmin);

// Product search for POS scanner/lookup
router.get('/products/search', posController.searchProducts);

// Sales
router.post('/sales', posController.createSale);
router.get('/sales', posController.getAllSales);
router.get('/sales/:saleNumber', posController.getSale);
router.patch('/sales/:saleNumber/void', posController.voidSale);

// Stats
router.get('/stats', posController.getPOSStats);

module.exports = router;
