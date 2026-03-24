const axios = require('axios');

/**
 * Safaricom Daraja M-Pesa Integration
 * Supports: Lipa na M-Pesa Online (STK Push)
 * Sandbox: https://sandbox.safaricom.co.ke
 * Production: https://api.safaricom.co.ke
 */

const MPESA_BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Get OAuth access token
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` }
    }
  );

  return response.data.access_token;
};

// Generate STK Push timestamp (YYYYMMDDHHmmss)
const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Generate password (Base64 of BusinessShortCode + Passkey + Timestamp)
const generatePassword = (timestamp) => {
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
};

/**
 * Initiate STK Push (Lipa na M-Pesa Online)
 */
const initiateSTKPush = async ({ phone, amount, orderId, orderNumber }) => {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);

  const callbackUrl = `${process.env.BACKEND_URL}/api/mpesa/callback`;

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: orderNumber,
    TransactionDesc: `Thrive Pharmacy - Order ${orderNumber}`
  };

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.ResponseCode !== '0') {
    throw new Error(response.data.ResponseDescription || 'STK Push failed');
  }

  return response.data;
};

/**
 * Query STK Push status
 */
const querySTKPushStatus = async (checkoutRequestId) => {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

/**
 * Register C2B URLs (for paybill/till payments)
 */
const registerC2BUrls = async () => {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/c2b/v1/registerurl`,
    {
      ShortCode: process.env.MPESA_SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: `${process.env.BACKEND_URL}/api/mpesa/confirmation`,
      ValidationURL: `${process.env.BACKEND_URL}/api/mpesa/validation`
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

module.exports = { initiateSTKPush, querySTKPushStatus, registerC2BUrls, getAccessToken };
