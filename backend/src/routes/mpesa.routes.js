const { Router } = require('express');
const { mpesaCallback } = require('../controllers/payment.controller');

const router = Router();

// M-Pesa callback - called by Safaricom (no auth)
router.post('/callback', mpesaCallback);

// C2B validation and confirmation
router.post('/validation', (req, res) => {
  console.log('M-Pesa C2B Validation:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

router.post('/confirmation', (req, res) => {
  console.log('M-Pesa C2B Confirmation:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

module.exports = router;
