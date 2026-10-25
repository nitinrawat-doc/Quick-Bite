# QuickBite 🍔

**Online Campus Canteen Ordering & Operations Management Platform**

QuickBite is a high-performance full-stack web application designed for campus canteens. It bridges student ordering and kitchen operations with real-time tracking, atomic inventory reservation, secure online payments, and business analytics.

---

## 🌟 Key Features

### 🎓 Student Experience
- **Authentication & Security:** Registration with password complexity meter, secure JWT authentication, session recovery across reloads, and student profile editor.
- **Dynamic Food Catalog:** Categorized menu loaded directly from MongoDB with search, filters, and live stock status.
- **Persistent Cart & Atomic Checkout:** LocalStorage-backed cart, server-side price recalculation (ignoring client prices), and atomic inventory deduction with rollback.
- **Flexible Payments:** Pay at Canteen Counter or Online Payment via Razorpay Gateway (cards, UPI, netbanking).
- **Live Order Tracking:** 5-stage status stepper (`pending` → `confirmed` → `preparing` → `ready_for_pickup` → `completed`) with 6-second polling and cancellation with inventory restoration.

### 🛡️ Admin Dashboard & Kitchen Operations
- **Role-Based Security:** Public registration strictly forces `student` role; admin creation requires `ADMIN_SETUP_SECRET`; protected with `adminOnly` backend middleware and `<AdminRoute>` frontend guards.
- **Menu Management:** Full CRUD for categories and food items with dual MIME/extension validated image uploading (5MB limit, Cloudinary + local fallback). Non-destructive soft deletes preserve historical order references.
- **Kitchen Fulfillment:** Incoming orders monitor with 10-second polling, valid status transitions, and audit logging.
- **Payment & Refund Ledger:** Complete transaction log with controlled refund processing, over-refund prevention, and duplicate refund guards.
- **Sales Analytics:** MongoDB aggregation pipelines generating net verified sales (refunds deducted), estimated Cost of Goods Sold (COGS), estimated gross profit, and daily revenue timeline.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7 | Responsive SPA (`#111214`, `#1D2025`, `#F28C45`, `#F5F5F5`) |
| **Backend** | Node.js v22, Express 5 | RESTful API with Helmet, sliding-window RateLimiter & Morgan |
| **Database** | MongoDB, Mongoose v9 | Atomic reservation pipelines, text & compound indexes |
| **Auth** | JWT (`jsonwebtoken`), bcryptjs | Bearer token authentication with role-based authorization |
| **Payments** | Razorpay Sandbox / Production | HMAC-SHA256 signature verification & webhook processing |
| **Media** | Multer, Cloudinary | 5MB size limit with strict MIME & extension verification |
| **Testing** | Node.js Native Test Runner (`node:test`) | 71 automated integration tests (Zero external dependencies) |

---

## 📁 Project Structure

```
quick bite/
├── backend/
│   ├── server.js              # Health endpoints (/health & /api/health), CORS, Helmet, routes
│   ├── .env.example           # Sanitized environment variable template
│   ├── package.json           # Backend scripts and dependencies
│   ├── tests/
│   │   ├── milestone2.test.js # 22 integration tests (Auth, Menu, Orders, Inventory)
│   │   ├── milestone3.test.js # 18 integration tests (Admin, Payments, Refunds, Analytics)
│   │   ├── milestone4.test.js # 11 integration tests (Health, Security, NoSQL, Sync)
│   │   └── milestoneAdmin.test.js # 20 integration tests (Admin Panel, Invites, Categories, RBAC)
│   └── src/
│       ├── config/            # DB and Cloudinary configuration
│       ├── models/            # User, Category, FoodItem, Order, Payment, AdminInvite
│       ├── controllers/       # Auth, Menu, Order, Admin, Payment, Upload, Invite controllers
│       ├── routes/            # Express route modules
│       ├── middleware/        # JWT protect, adminOnly, rateLimiter, errorHandler
│       ├── scripts/           # provisionAdmin.js secure CLI provisioning utility
│       └── seed/              # Idempotent database seeder
├── frontend/
│   ├── src/
│   │   ├── api/client.js      # Axios client with JWT interceptor & API endpoints
│   │   ├── context/           # AuthContext & CartContext
│   │   ├── components/        # Common, Menu, Cart, Layout, Admin components
│   │   └── pages/             # Student pages & Admin views (/admin/food, /admin/categories, etc.)
│   └── index.html             # Entry point with SEO meta tags & font
├── docs/
│   └── PROJECT_STATUS.md     # Detailed verification and milestone status report
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.x or later (v22 recommended)
- **MongoDB:** Local instance on `127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
Install dependencies for root, backend, and frontend:
```bash
npm run install:all
```

### 3. Environment Configuration
Copy the template in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Fill in the variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickbite
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_SETUP_SECRET=quickbite_super_admin_setup_secret_2026

# Razorpay sandbox test credentials
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional Cloudinary image hosting
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Database Seeding & Secure Admin Provisioning

**Option A: Database Seeding (Pre-populates 16 menu items & default admin)**
```bash
npm run seed
```
- Default Admin Email: `admin@quickbite.campus`
- Default Admin Password: `AdminSecure123!`

**Option B: Generate Single-Use Admin Invitation Code (College Demo / Operations)**
To securely onboard a canteen administrator via the web registration page:
```bash
npm run setup:admin -- --invite
# OR: node backend/src/scripts/provisionAdmin.js --invite
```
This prints a cryptographically secure, time-limited (48h) single-use invitation code:
```
[SUCCESS] Single-use Admin Invitation Code generated:
  Invitation Code: qb_inv_...
  Expires At:      48 hours
```
1. Open the Registration page at `http://localhost:5173/register`.
2. Toggle the account type selector to **Admin**.
3. Paste the invitation code and fill in account details.
4. The server validates the code and marks it as redeemed. Expired or reused codes are rejected with 403 Forbidden.

**Option C: Direct Server-Side CLI Provisioning**
Provision an administrator directly without hardcoded credentials:
```bash
npm run setup:admin -- --name "Canteen Manager" --email "manager@campus.edu" --password "StrongPassword123!"
```

### 5. Run Automated Tests
Execute all 71 automated integration tests (Milestones 2, 3, 4, and Admin Security):
```bash
npm test
```
*Zero external test dependencies required — uses the native Node.js test runner `node:test`.*

### 6. Start Development Servers
Start both backend and frontend concurrently:
```bash
# Option A — Concurrent dev server (root)
npm run dev

# Option B — Separate terminals
npm run dev:backend   # Express API on port 5000
npm run dev:frontend  # Vite React App on port 5173 (or 5174 if 5173 is occupied)
```
The frontend automatically proxies `/api/*` requests to `http://localhost:5000`.

---

## 🔒 Security Architecture

1. **Role Escalation Prevention:** Public registration ignores requested roles and forces `role: 'student'`. Admin creation requires an environment-backed `ADMIN_SETUP_SECRET`.
2. **Server-Side Pricing:** Cart totals are recalculated by the backend from database prices; client-provided prices are ignored.
3. **Atomic Inventory Decrement:** Uses Mongoose `findOneAndUpdate` with `$inc` and `$gte` conditions to prevent race conditions during concurrent checkouts.
4. **Payment Cryptographic Validation:** Verifies Razorpay HMAC-SHA256 signatures before confirming orders or webhooks.
5. **NoSQL & Cast Protection:** Validates ObjectIds, sanitizes regex search parameters, and handles cast errors gracefully.
6. **File Upload Hardening:** Strict MIME type and extension whitelist (`.jpg`, `.jpeg`, `.png`, `.webp`) with a 5MB limit.

---

## 🚢 Deployment Instructions

### Backend (Render / Railway / Heroku)
- **Root Directory:** `backend/`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Endpoint:** `GET /health` or `GET /api/health`

### Frontend (Vercel / Netlify)
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## 📚 Project Documentation & Evaluation Guides

- **Live Demonstration Script:** [`docs/DEMO_CHECKLIST.md`](docs/DEMO_CHECKLIST.md) — Step-by-step walkthrough for student journey, kitchen fulfillment, payment sandbox, and analytics.
- **Detailed Milestone Status & Test Logs:** [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Comprehensive technical audit, bug fixes, endpoint listings, and 51 passing integration test logs.

---

## 💼 Professional Resume Description

**QuickBite — Full-Stack Campus Canteen Ordering & Operations Platform (MERN Stack)**
- Built a responsive full-stack canteen management system with **React 19**, **Vite**, **Tailwind CSS**, and **Express 5**, reducing counter wait times through real-time ordering and pickup scheduling.
- Implemented atomic inventory reservation algorithms using **MongoDB** find-and-modify pipelines, preventing stock overselling during concurrent peak ordering periods.
- Engineered secure online checkout with **Razorpay**, validating payments via server-side **HMAC-SHA256** signatures, automated webhook reconciliation, and refund workflows.
- Developed an administrative operations suite featuring kitchen fulfillment steppers, non-destructive soft deletes for historical order integrity, and **MongoDB aggregation** analytics for verified net sales, COGS, and estimated gross profit.
- Achieved high reliability with **51 automated integration tests** covering privilege escalation defenses, payment verification, race conditions, and session lifecycles.

---

## License
ISC
