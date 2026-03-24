const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getDashboardStats,
  getCustomers,
  toggleCustomerStatus
} = require('../controllers/admin.controller');
const { getAllOrders, updateOrderStatus } = require('../controllers/order.controller');
const { getAllPrescriptions, reviewPrescription } = require('../controllers/prescription.controller');

const router = Router();

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Customer management
router.get('/customers', getCustomers);
router.put('/customers/:id/toggle', toggleCustomerStatus);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Prescriptions
router.get('/prescriptions', getAllPrescriptions);
router.put('/prescriptions/:id/review', reviewPrescription);

module.exports = router;
