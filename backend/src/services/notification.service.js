const nodemailer = require('nodemailer');

// Create mail transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development: use Ethereal email for testing
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'ethereal@example.com',
      pass: process.env.ETHEREAL_PASS || 'password'
    }
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Thrive Pharmacy" <${process.env.FROM_EMAIL || 'noreply@thrivepharmacy.co.ke'}>`,
      to,
      subject,
      html,
      text
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Email sending failed:', err);
    throw err;
  }
};

/**
 * Send SMS via Africa's Talking (or similar Kenyan SMS gateway)
 * Structure is in place — connect actual SMS provider credentials
 */
const sendSMS = async ({ phone, message }) => {
  // TODO: Integrate with Africa's Talking or Twilio for Kenyan SMS
  // Example with Africa's Talking:
  // const AfricasTalking = require('africastalking');
  // const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
  // const sms = at.SMS;
  // await sms.send({ to: [phone], message, from: 'THRIVE' });

  console.log(`[SMS] To: ${phone} | Message: ${message}`);
};

// Order confirmation email template
const orderConfirmationTemplate = (user, order) => {
  const itemsHtml = order.items
    .map(item => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.product.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">KES ${parseFloat(item.unitPrice).toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">KES ${parseFloat(item.subtotal).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmation</title></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#0d9488;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0">Thrive Pharmacy</h1>
        <p style="color:#ccfbf1;margin:5px 0">Order Confirmation</p>
      </div>

      <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb">
        <p>Dear ${user.firstName},</p>
        <p>Thank you for your order! We've received your order and will process it shortly.</p>

        <div style="background:white;padding:15px;border-radius:8px;margin:15px 0">
          <h3 style="margin:0 0 10px;color:#0d9488">Order #${order.orderNumber}</h3>
          <p style="margin:5px 0;color:#6b7280">Date: ${new Date(order.createdAt).toLocaleDateString('en-KE', { dateStyle: 'full' })}</p>
          <p style="margin:5px 0;color:#6b7280">Status: ${order.status.replace(/_/g, ' ')}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:10px;text-align:left">Product</th>
              <th style="padding:10px;text-align:center">Qty</th>
              <th style="padding:10px;text-align:right">Unit Price</th>
              <th style="padding:10px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:8px;text-align:right;font-weight:bold">Subtotal:</td>
              <td style="padding:8px;text-align:right">KES ${parseFloat(order.subtotal).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:8px;text-align:right">Delivery:</td>
              <td style="padding:8px;text-align:right">KES ${parseFloat(order.deliveryFee).toLocaleString()}</td>
            </tr>
            <tr style="background:#f0fdf4">
              <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;color:#0d9488">Total:</td>
              <td style="padding:8px;text-align:right;font-weight:bold;color:#0d9488">KES ${parseFloat(order.total).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        ${order.status === 'PENDING_PRESCRIPTION' ? `
          <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:15px;margin:15px 0">
            <p style="margin:0;color:#92400e"><strong>⚠️ Prescription Required</strong></p>
            <p style="margin:5px 0;color:#92400e">Your order contains prescription medication. Please log in to your account and upload your prescription to proceed.</p>
          </div>
        ` : ''}

        <p>If you have any questions, please contact us at <a href="mailto:support@thrivepharmacy.co.ke" style="color:#0d9488">support@thrivepharmacy.co.ke</a> or call <strong>+254 700 000 000</strong>.</p>

        <p>Thank you for choosing Thrive Pharmacy!</p>
      </div>

      <div style="padding:15px;text-align:center;color:#9ca3af;font-size:12px">
        <p>© ${new Date().getFullYear()} Thrive Pharmacy. All rights reserved.</p>
        <p>Nairobi, Kenya | www.thrivepharmacy.co.ke</p>
      </div>
    </body>
    </html>
  `;
};

const sendOrderConfirmation = async (user, order) => {
  await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: `Order Confirmed - #${order.orderNumber} | Thrive Pharmacy`,
      html: orderConfirmationTemplate(user, order),
      text: `Order #${order.orderNumber} confirmed. Total: KES ${parseFloat(order.total).toLocaleString()}`
    }),
    user.phone && sendSMS({
      phone: user.phone,
      message: `Thrive Pharmacy: Your order #${order.orderNumber} has been confirmed. Total: KES ${parseFloat(order.total).toLocaleString()}. Track at thrivepharmacy.co.ke`
    })
  ]);
};

const sendOrderStatusUpdate = async (user, order) => {
  const statusMessages = {
    PAYMENT_CONFIRMED: 'Payment received! We\'re preparing your order.',
    PRESCRIPTION_APPROVED: 'Your prescription has been approved! Please complete payment.',
    PRESCRIPTION_REJECTED: 'Your prescription was rejected. Please re-upload a valid prescription.',
    PROCESSING: 'Your order is being prepared by our pharmacists.',
    DISPATCHED: `Your order has been dispatched! ${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`,
    DELIVERED: 'Your order has been delivered. Thank you for choosing Thrive Pharmacy!',
    CANCELLED: 'Your order has been cancelled.'
  };

  const message = statusMessages[order.status] || `Order status updated to: ${order.status}`;

  await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: `Order Update - #${order.orderNumber} | Thrive Pharmacy`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#0d9488">Order Update</h2>
          <p>Dear ${user.firstName},</p>
          <p><strong>Order #${order.orderNumber}:</strong> ${message}</p>
          ${order.trackingNumber ? `<p>Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ''}
          <p>Track your order at <a href="${process.env.FRONTEND_URL}/orders/${order.orderNumber}" style="color:#0d9488">thrivepharmacy.co.ke</a></p>
          <p>Thrive Pharmacy Team</p>
        </div>
      `,
      text: `Order #${order.orderNumber}: ${message}`
    }),
    user.phone && sendSMS({
      phone: user.phone,
      message: `Thrive Pharmacy - Order #${order.orderNumber}: ${message}`
    })
  ]);
};

module.exports = { sendEmail, sendSMS, sendOrderConfirmation, sendOrderStatusUpdate };
