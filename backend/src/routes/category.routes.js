const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategory);
router.post('/', authenticate, requireAdmin, createCategory);
router.put('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

module.exports = router;
