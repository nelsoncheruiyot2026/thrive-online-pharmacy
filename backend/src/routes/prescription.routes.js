const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  uploadPrescription,
  getPrescription,
  getAllPrescriptions,
  reviewPrescription
} = require('../controllers/prescription.controller');

const router = Router();

router.use(authenticate);

router.post('/orders/:orderId/upload', upload.single('prescription'), uploadPrescription);
router.get('/orders/:orderId', getPrescription);

// Admin routes
router.get('/admin/all', requireAdmin, getAllPrescriptions);
router.put('/admin/:id/review', requireAdmin, [
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
  body('reviewNotes').optional().trim(),
  validate
], reviewPrescription);

module.exports = router;
