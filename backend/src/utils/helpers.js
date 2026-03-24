const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique order number
 * Format: THP-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `THP-${dateStr}-${random}`;
};

/**
 * Format amount to KES currency
 */
const formatCurrency = (amount, currency = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Sanitize string for slugs
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Format phone number to E.164 format for Kenya
 * Accepts: 0712345678, +254712345678, 254712345678
 */
const formatKenyanPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.slice(1);
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return '254' + cleaned;
  }

  throw new Error('Invalid Kenyan phone number');
};

/**
 * Calculate delivery fee based on order subtotal
 */
const calculateDeliveryFee = (subtotal) => {
  if (subtotal >= 5000) return 0;      // Free delivery over KES 5,000
  if (subtotal >= 2000) return 100;    // KES 100 for orders KES 2,000-4,999
  return 200;                           // KES 200 for orders under KES 2,000
};

module.exports = {
  generateOrderNumber,
  formatCurrency,
  slugify,
  formatKenyanPhone,
  calculateDeliveryFee
};
