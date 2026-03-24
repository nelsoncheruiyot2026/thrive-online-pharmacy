const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// Addresses
router.get('/addresses', async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
  res.json({ success: true, data: addresses });
});

router.post('/addresses', [
  body('street').notEmpty().withMessage('Street address required'),
  body('city').notEmpty().withMessage('City required'),
  body('county').notEmpty().withMessage('County required'),
  validate
], async (req, res) => {
  const { street, city, county, country, postalCode, label, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      street, city, county,
      country: country || 'Kenya',
      postalCode,
      label: label || 'Home',
      isDefault: isDefault || false
    }
  });

  res.status(201).json({ success: true, data: address });
});

router.put('/addresses/:id', async (req, res) => {
  const { id } = req.params;
  const { isDefault, ...data } = req.body;

  const address = await prisma.address.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
  }

  const updated = await prisma.address.update({
    where: { id },
    data: { ...data, ...(isDefault !== undefined && { isDefault }) }
  });

  res.json({ success: true, data: updated });
});

router.delete('/addresses/:id', async (req, res) => {
  const { id } = req.params;

  const address = await prisma.address.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  await prisma.address.delete({ where: { id } });

  res.json({ success: true, message: 'Address deleted' });
});

module.exports = router;
