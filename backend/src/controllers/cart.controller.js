const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

const getCart = async (req, res) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              imageUrl: true,
              stock: true,
              requiresPrescription: true,
              isActive: true
            }
          }
        }
      }
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: { items: { include: { product: true } } }
    });
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    data: {
      ...cart,
      subtotal: subtotal.toFixed(2),
      itemCount,
      requiresPrescription: cart.items.some(item => item.product.requiresPrescription)
    }
  });
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true }
  });

  if (!product) throw new AppError('Product not found', 404);
  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items in stock`, 400);
  }

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } }
  });

  const newQuantity = existingItem
    ? existingItem.quantity + parseInt(quantity)
    : parseInt(quantity);

  if (product.stock < newQuantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: newQuantity },
    create: { cartId: cart.id, productId, quantity: parseInt(quantity) },
    include: {
      product: {
        select: { id: true, name: true, price: true, imageUrl: true, stock: true }
      }
    }
  });

  res.json({
    success: true,
    message: 'Added to cart',
    data: cartItem
  });
};

const updateCartItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true }
  });

  if (!cartItem || cartItem.cart.userId !== req.user.id) {
    throw new AppError('Cart item not found', 404);
  }

  if (parseInt(quantity) <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return res.json({ success: true, message: 'Item removed from cart' });
  }

  if (cartItem.product.stock < parseInt(quantity)) {
    throw new AppError(`Only ${cartItem.product.stock} items available`, 400);
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: parseInt(quantity) },
    include: { product: { select: { id: true, name: true, price: true, imageUrl: true } } }
  });

  res.json({ success: true, message: 'Cart updated', data: updated });
};

const removeFromCart = async (req, res) => {
  const { itemId } = req.params;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true }
  });

  if (!cartItem || cartItem.cart.userId !== req.user.id) {
    throw new AppError('Cart item not found', 404);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  res.json({ success: true, message: 'Item removed from cart' });
};

const clearCart = async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  res.json({ success: true, message: 'Cart cleared' });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
