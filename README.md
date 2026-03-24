# 🏥 Thrive Online Pharmacy

A full-stack online pharmacy e-commerce platform built for **Thrive Pharmacy Kenya**. Customers can browse medications, place orders, upload prescriptions, and pay via **M-Pesa STK Push**. Admins manage inventory, orders, and prescription approvals from a dedicated dashboard.

![Thrive Pharmacy](https://img.shields.io/badge/Thrive-Pharmacy-teal?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue?style=flat-square&logo=postgresql)
![M-Pesa](https://img.shields.io/badge/M--Pesa-Daraja_API-green?style=flat-square)

---

## ✨ Features

### Customer Storefront
- 🏠 **Homepage** — Featured products, category navigation, search bar
- 🔍 **Product Catalog** — Filter by category, price, prescription type; sort options
- 💊 **Product Detail** — Description, dosage info, stock status, customer reviews
- 🛒 **Shopping Cart** — Add/remove items, update quantities, live subtotals
- 🚚 **Checkout** — Delivery address management, payment method selection
- 📋 **Order Tracking** — Real-time order status timeline, prescription upload
- 👤 **Customer Account** — Profile management, address book, order history

### Prescription Handling
- 📤 Upload prescription images (JPEG, PNG, PDF) during checkout
- 🔬 Admin/pharmacist review queue with approve/reject workflow
- 📧 Email + SMS notifications on prescription status updates

### Admin Dashboard
- 📊 **Analytics** — Revenue charts, order counts, customer stats, low-stock alerts
- 📦 **Product Management** — Add/edit/delete products, prescription flags, images via Cloudinary
- 📋 **Order Management** — Status updates (Processing → Dispatched → Delivered), tracking numbers
- 📄 **Prescription Queue** — View uploaded prescriptions, approve or reject with notes
- 👥 **Customer Management** — View all customers, activate/deactivate accounts

### Payments
- 📱 **M-Pesa STK Push** — Safaricom Daraja API integration with callback handler
- 💵 **Cash on Delivery** — Supported out of the box
- 💳 **Card Payment** — Placeholder ready for Stripe/Flutterwave integration

### Notifications
- ✉️ Order confirmation emails (HTML template)
- 📱 SMS notifications via Africa's Talking (structure ready)
- 📧 Order status update emails

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router v6 |
| Backend | Node.js, Express 4, JWT Auth |
| Database | PostgreSQL, Prisma ORM |
| Payments | Safaricom Daraja API (M-Pesa STK Push) |
| Images | Cloudinary |
| Email | Nodemailer (SMTP) |
| Validation | express-validator |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/nelsoncheruiyot2026/thrive-online-pharmacy.git
cd thrive-online-pharmacy
```

### 2. Install dependencies
```bash
# Install all dependencies
npm run install:all
```

### 3. Configure environment variables
```bash
# Copy the example env file
cp .env.example backend/.env

# Edit with your actual values
nano backend/.env
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Set up the database
```bash
# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start development servers
```bash
# Terminal 1 — Backend API (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@thrivepharmacy.co.ke | Admin@Thrive2024 |
| Pharmacist | pharmacist@thrivepharmacy.co.ke | Pharm@Thrive2024 |
| Customer | demo@example.com | Customer@123 |

---

## 📱 M-Pesa Integration

This project integrates with **Safaricom Daraja API** for Lipa Na M-Pesa Online (STK Push).

### Sandbox Setup
1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get **Consumer Key** and **Consumer Secret**
3. Use the sandbox shortcode `174379` and passkey from the portal
4. Set `MPESA_ENV=sandbox` in your `.env`

### Callback URL
For local development, use **ngrok** to expose your backend:
```bash
ngrok http 5000
# Use the HTTPS URL: https://xxxx.ngrok.io
```
Set `BACKEND_URL=https://xxxx.ngrok.io` in your `.env`.

### Production
1. Apply for a live M-Pesa shortcode (Paybill or Till)
2. Set `MPESA_ENV=production`
3. Update with your live credentials

---

## 📁 Project Structure

```
thrive-online-pharmacy/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   └── src/
│       ├── controllers/           # Route handlers
│       ├── middleware/            # Auth, error handling, uploads
│       ├── routes/                # Express routers
│       ├── services/              # M-Pesa, Cloudinary, Notifications
│       └── utils/                 # Helpers, seed script
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── common/            # ProductCard, Pagination, etc.
│       │   └── layout/            # Navbar, Footer, AdminLayout
│       ├── pages/
│       │   ├── customer/          # All customer-facing pages
│       │   └── admin/             # Admin dashboard pages
│       ├── services/              # Axios API client
│       └── store/                 # Zustand state (auth, cart)
│
├── .env.example                   # Environment variable template
├── .gitignore
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/categories` | All categories |
| GET | `/api/cart` | Get user cart |
| POST | `/api/cart/items` | Add to cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | User order history |
| POST | `/api/payments/mpesa/initiate` | Start M-Pesa STK Push |
| GET | `/api/payments/mpesa/status/:id` | Check payment status |
| POST | `/api/mpesa/callback` | Safaricom callback |
| POST | `/api/prescriptions/orders/:id/upload` | Upload prescription |
| GET | `/api/admin/dashboard` | Admin stats |
| GET | `/api/admin/orders` | All orders (admin) |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/prescriptions` | Prescription queue |
| PUT | `/api/admin/prescriptions/:id/review` | Approve/reject prescription |

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Set all environment variables in your hosting dashboard
2. Run `npm run db:migrate:prod` for production migrations
3. Start with `npm start`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL=https://your-backend.railway.app/api`
2. Build with `npm run build`
3. Deploy the `dist/` folder

---

## 📄 License

MIT License — feel free to use and adapt for your pharmacy project.

---

**Built with ❤️ for Kenya's healthcare sector**
