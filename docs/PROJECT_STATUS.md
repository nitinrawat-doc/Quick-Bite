# QuickBite — Project Status (Milestone 5: Local Testing, Browser Verification & Deployment Readiness)

## Architecture Overview

```
quick bite/
├── backend/                   # Express 5 + MongoDB / Mongoose API
│   ├── server.js              # Entry point (Health check /health & /api/health, CORS, Helmet, RateLimiter)
│   ├── .env.example           # Complete sanitized environment variable template
│   ├── package.json           # Backend scripts and dependencies
│   ├── uploads/               # Local media directory with MIME/extension validation
│   ├── tests/
│   │   ├── milestone2.test.js # 22 integration tests (Auth, Menu, Orders, Inventory)
│   │   ├── milestone3.test.js # 18 integration tests (Admin, Payments, Refunds, Analytics)
│   │   └── milestone4.test.js # 11 integration tests (Health, Security, NoSQL, Sync, Soft-deletes)
│   └── src/
│       ├── config/
│       │   ├── db.js          # MongoDB connection with retry & logging
│       │   └── cloudinary.js  # Cloudinary config with fallback to local storage
│       ├── models/
│       │   ├── User.js        # User model (bcryptjs hashing, matchPassword, admin/student roles)
│       │   ├── Category.js    # Food category schema with slug, icon, and sortOrder
│       │   ├── FoodItem.js    # Food item schema with costPrice, stockQuantity, soft-delete flag, text index
│       │   ├── Order.js       # Order model (item snapshots, cost snapshots, pickup token, timeline)
│       │   └── Payment.js     # Payment model (Razorpay references, refund audit trail)
│       ├── controllers/
│       │   ├── authController.js       # register, login, getProfile, setupAdmin (invite/token flow)
│       │   ├── menuController.js       # GET /api/menu, GET /api/menu/:id (soft-delete filtered)
│       │   ├── orderController.js      # createOrder, getMyOrders, getOrderById, cancelOrder (with Payment sync)
│       │   ├── adminFoodController.js  # Admin Food & Category CRUD, stock & availability toggles
│       │   ├── adminOrderController.js # Admin Order management, status progression, cancellations
│       │   ├── adminAnalyticsController.js # MongoDB aggregations for sales, COGS & gross profit
│       │   ├── adminUploadController.js# Multer image upload (5MB max, MIME & extension validated)
│       │   └── paymentController.js   # Razorpay sandbox order, HMAC verification, webhooks, refunds
│       ├── routes/
│       │   ├── authRoutes.js      # /api/auth
│       │   ├── menuRoutes.js      # /api/menu
│       │   ├── orderRoutes.js     # /api/orders
│       │   ├── adminRoutes.js     # /api/admin/* (protected with protect & adminOnly)
│       │   └── paymentRoutes.js   # /api/payments/* (create-order, verify, cancel, webhook)
│       ├── middleware/
│       │   ├── authMiddleware.js  # JWT protect & adminOnly guards
│       │   ├── rateLimiter.js     # Sliding-window auth rate limiting
│       │   └── errorHandler.js    # Centralized error handler with CastError, ValidationError, DuplicateKey handling
│       └── seed/
│           └── seedData.js        # Seed script with default admin (admin@quickbite.campus) & menu items
│
├── frontend/                  # Vite 8 + React 19 + Tailwind CSS v4
│   ├── index.html             # Entry HTML with Inter font + SEO meta
│   ├── vite.config.js         # Tailwind v4 plugin + API proxy
│   └── src/
│       ├── main.jsx           # React entry with BrowserRouter
│       ├── App.jsx            # App wrapper with AuthProvider, CartProvider, AdminRoute guards
│       ├── index.css          # Design system (#111214, #1D2025, #F28C45, #F5F5F5)
│       ├── api/
│       │   └── client.js      # Axios client with JWT interceptor & comprehensive API methods
│       ├── context/
│       │   ├── AuthContext.jsx  # Student/Admin auth state & session recovery
│       │   └── CartContext.jsx  # Cart state with localStorage persistence
│       ├── components/
│       │   ├── common/
│       │   │   ├── Logo.jsx         # QB monogram + wordmark
│       │   │   ├── FoodImage.jsx    # Lazy image with fallback, skeleton & dynamic prop syncing
│       │   │   ├── SkeletonCard.jsx # Skeleton card loading state
│       │   │   ├── ProtectedRoute.jsx # Route authentication guard
│       │   │   └── AdminRoute.jsx   # Admin role verification guard (403 Access Denied screen)
│       │   ├── menu/
│       │   │   └── FoodCard.jsx     # Food card with stock badge & cart controls
│       │   ├── cart/
│       │   │   └── CartDrawer.jsx   # Slide-in cart drawer with checkout link
│       │   └── layout/
│       │       ├── Navbar.jsx       # Sticky top nav with search, profile dropdown & admin portal shortcut
│       │       ├── BottomNav.jsx    # Mobile bottom navigation
│       │       └── AdminLayout.jsx  # Admin sidebar layout with active states & admin badge
│       └── pages/
│           ├── MenuPage.jsx         # Student menu (search, category filter, floating cart bar)
│           ├── LoginPage.jsx        # Authentication (student & admin login with smart redirect)
│           ├── RegisterPage.jsx     # Student registration with validation
│           ├── CheckoutPage.jsx     # Checkout with Pay-at-Counter or Razorpay Gateway
│           ├── OrdersPage.jsx       # Student order history with status filters & pagination
│           ├── OrderTrackingPage.jsx # Real-time order tracking with 6s polling & cancellation
│           ├── ProfilePage.jsx      # Student profile & details editor
│           └── admin/
│               ├── AdminDashboard.jsx       # Live KPIs, active pipeline, low stock & sales summary
│               ├── AdminFoodManagement.jsx  # Food/Category CRUD, image upload, availability toggles
│               ├── AdminOrders.jsx          # Live order management, status progression, audit trail
│               ├── AdminInventory.jsx       # Stock levels, low-stock alerts, quick stock adjustments
│               ├── AdminPayments.jsx        # Payment ledger, refund workflow with duplicate protection
│               └── AdminAnalytics.jsx       # Date range filters, verified sales, COGS, gross profit
│
├── docs/
│   └── PROJECT_STATUS.md     # This file
├── package.json              # Root convenience scripts (dev, test, seed, build)
├── .gitignore
└── README.md
```

---

## Verified Features Complete

### 1. Student Ordering & Account Lifecycle
- **Authentication:** Registration with password complexity check, login with JWT issuance, session recovery on refresh, and secure profile editing.
- **Menu Catalog:** Dynamic browsing from MongoDB with real-time availability filtering, category selector, debounced text search, and low/out-of-stock badges.
- **Persistent Cart:** Multi-item cart with quantity controls, subtotal computation, persisted in `localStorage`.
- **Checkout & Inventory Deduction:** Server recalculates pricing strictly from MongoDB records; concurrent order attempts atomically decrement stock and rollback if unavailable.
- **Order Tracking & Cancellation:** Live 5-step status progression (`pending` → `confirmed` → `preparing` → `ready_for_pickup` → `completed`) with 6-second polling. Cancellations in pending/confirmed state safely restore inventory and synchronize the payment ledger.

### 2. Admin Dashboard & Operations
- **Access Control:** No public admin registration; setup secret token onboarding via `POST /api/auth/setup-admin`; backend `adminOnly` route middleware; frontend `<AdminRoute>` protection.
- **Menu & Catalog Management:** Complete CRUD for food items and categories. Image uploads with dual MIME type and file-extension validation (5MB max) with Cloudinary hosting and local `/uploads/` fallback. Safe non-destructive soft deletion (`isDeleted: true`) prevents orphaned references in historical orders.
- **Kitchen Fulfillment:** Real-time incoming order dashboard with 10-second polling, valid status transition enforcement, and detailed order audit trail.
- **Payment Records & Refunds:** Transaction ledger, controlled refund processing, duplicate refund prevention, and refund cap validation.
- **Sales Analytics:** MongoDB aggregation pipelines calculating verified net sales, estimated Cost of Goods Sold (COGS), estimated gross profit (clearly labeled as gross margin before canteen operational overheads), order distribution, and daily revenue timeline.

### 3. Payment Gateway Integration
- **Razorpay Sandbox / Live Architecture:** Server generates Razorpay orders via `POST /api/payments/create-order` using server-side credentials.
- **Cryptographic Verification:** Server verifies HMAC-SHA256 signatures (`order_id|payment_id` against `RAZORPAY_KEY_SECRET`).
- **Amount Matching:** Rejects payment verification if the verified amount mismatches the order subtotal.
- **Idempotency:** Repeated payment verifications return recorded state without duplicate order updates or inventory deductions.
- **Webhook Verification:** `POST /api/payments/webhook` cryptographically validates incoming webhook signatures.

---

## Bugs Fixed in Milestone 4 QA

1. **Mobile Floating Cart Price Calculation:** `MenuPage.jsx` had a placeholder calculation `₹{menuData.foodItems.reduce((_, __) => _, 0)}`; updated to dynamically import and display `totalPrice` and `totalItems` from `CartContext`.
2. **FoodImage Dynamic Prop Updating:** Added `useEffect` in `FoodImage.jsx` to synchronize `imgSrc` and skeleton loading state whenever the `src` prop changes dynamically during catalog editing or uploads.
3. **CORS Flexibility:** Updated `server.js` to parse comma-separated `CLIENT_URL` domains, permitting both local development (`http://localhost:5173`) and production web applications.
4. **Health Check System Diagnostics:** Added `/health` and `/api/health` endpoints returning database connection status (`connected`, `connecting`, `disconnected`), server uptime in seconds, and environment.
5. **Admin Setup Token Compatibility:** Updated `authController.js` to accept either `ADMIN_SETUP_SECRET` or `ADMIN_SETUP_TOKEN` from environment variables.
6. **Mongoose 9 Deprecation Warnings:** Replaced deprecated `{ new: true }` options with `{ returnDocument: 'after' }` in `paymentController.js` and `seedData.js`.
7. **Order & Payment Cancellation Synchronization:** Updated `orderController.js` and `adminOrderController.js` so cancelling an order automatically sets associated pending `Payment` records to `failed` with the cancellation reason.
8. **File Upload Security:** Added strict file extension verification (`.jpg`, `.jpeg`, `.png`, `.webp`) in `adminUploadController.js` alongside MIME type inspection.
9. **Admin Navigation Shortcut:** Added an Admin Portal quick-link in `Navbar.jsx` (and profile dropdown) when an authenticated user has an `admin` role, and updated `LoginPage.jsx` to route admins directly to `/admin`.
10. **Environment Variable Template:** Updated `backend/.env.example` with complete placeholder values for all services without committing secrets.

---

## Build and Test Verification

### 1. Integration Test Results (51 / 51 Passing)

```
> quickbite@1.0.0 test
> cd backend && npm test

> quickbite-backend@1.0.0 test
> node tests/milestone2.test.js && node tests/milestone3.test.js && node tests/milestone4.test.js

TAP version 13
# Subtest: QuickBite Milestone 2 Test Suite
    ok 1 - POST /api/auth/register — registers a student user and returns JWT
    ok 2 - POST /api/auth/register — enforces student role and ignores requested admin role
    ok 3 - POST /api/auth/register — rejects duplicate email registration with 409
    ok 4 - POST /api/auth/register — validates short passwords (< 6 chars)
    ok 5 - POST /api/auth/login — authenticates valid credentials
    ok 6 - POST /api/auth/login — rejects invalid password with 401
    ok 7 - GET /api/auth/me — rejects unauthenticated request with 401
    ok 8 - GET /api/auth/me — returns current student profile with valid token
    ok 9 - GET /api/menu — returns categories and items
    ok 10 - GET /api/menu?category=burgers — filters items by category slug
    ok 11 - GET /api/menu?search=Paneer — searches items by text query
    ok 12 - POST /api/orders — rejects empty cart checkout with 400
    ok 13 - POST /api/orders — rejects invalid or negative quantity with 400
    ok 14 - POST /api/orders — recalculates prices on server (ignoring client-tampered price)
    ok 15 - POST /api/orders — rejects order when requested quantity exceeds inventory
    ok 16 - POST /api/orders — handles concurrent ordering and prevents overselling
    ok 17 - GET /api/orders — student only sees their own orders
    ok 18 - GET /api/orders/:id — enforces ownership and rejects cross-student access with 403
    ok 19 - GET /api/orders/:id — allows owner to view order details
    ok 20 - PATCH /api/orders/:id/cancel — rejects cross-student cancellation with 403
    ok 21 - PATCH /api/orders/:id/cancel — cancels order and restores inventory
    ok 22 - PATCH /api/orders/:id/cancel — prevents double cancellation and double stock restoration
    1..22
ok 1 - QuickBite Milestone 2 Test Suite (pass 22, fail 0)

# Subtest: QuickBite Milestone 3 Test Suite
    ok 1 - POST /api/auth/setup-admin — rejects setup with invalid setup token (403)
    ok 2 - POST /api/auth/setup-admin — creates admin account with valid setup token
    ok 3 - POST /api/auth/register — student registration cannot escalate to admin
    ok 4 - GET /api/admin/orders — student token gets 403 Forbidden
    ok 5 - POST /api/admin/categories — admin creates category
    ok 6 - POST /api/admin/food — admin creates food item with cost price & stock
    ok 7 - PUT /api/admin/food/:id — admin updates food item
    ok 8 - PATCH /api/admin/food/:id/toggle-availability — admin toggles availability
    ok 9 - DELETE /api/admin/categories/:id — prevents deletion when active items exist
    ok 10 - POST /api/payments/create-order — creates Razorpay payment order
    ok 11 - POST /api/payments/verify — rejects mismatched payment amount (400)
    ok 12 - POST /api/payments/verify — rejects forged/invalid HMAC signature (400)
    ok 13 - POST /api/payments/verify — verifies valid HMAC-SHA256 signature and confirms order
    ok 14 - POST /api/payments/cancel — restores stock when payment fails/abandoned
    ok 15 - PATCH /api/admin/orders/:id/status — enforces valid transitions
    ok 16 - POST /api/admin/payments/:id/refund — processes refund & prevents duplicate refunds
    ok 17 - GET /api/admin/analytics — aggregates sales, COGS, gross profit & exclusions
    ok 18 - DELETE /api/admin/food/:id — soft deletes item with historical orders
    1..18
ok 1 - QuickBite Milestone 3 Test Suite (pass 18, fail 0)

# Subtest: QuickBite Milestone 4 — Final QA, Security & Polish Suite
    ok 1 - GET /health & /api/health — reports healthy uptime and database connection
    ok 2 - POST /api/auth/setup-admin — accepts ADMIN_SETUP_SECRET token
    ok 3 - POST /api/auth/register — rejects role tampering from student signup
    ok 4 - GET /api/admin/orders — rejects student token with 403 Forbidden
    ok 5 - GET /api/auth/me — rejects expired or tampered JWT with 401
    ok 6 - GET /api/menu/:id — handles invalid MongoDB ObjectId gracefully with 400
    ok 7 - POST /api/orders — rejects negative quantity and float values with 400
    ok 8 - POST /api/orders — creates order, reserves inventory and creates Payment record
    ok 9 - PATCH /api/orders/:id/cancel — restores stock and synchronizes Payment status
    ok 10 - PATCH /api/orders/:id/cancel — prevents double cancellation and double stock restoration
    ok 11 - DELETE /api/admin/food/:id — soft-deletes item preserving historical order references
    1..11
ok 1 - QuickBite Milestone 4 — Final QA, Security & Polish Suite (pass 11, fail 0)

Total: 51 tests passed, 0 failed.
```

### 2. Frontend Production Build
```
vite v8.3.4 building client environment for production...
✓ 1998 modules transformed.
dist/index.html                   0.92 kB │ gzip:   0.49 kB
dist/assets/index-DcHd21f_.css   11.63 kB │ gzip:   3.39 kB
dist/assets/index-h5WVt5Gh.js   491.83 kB │ gzip: 138.43 kB
✓ built in 6.53s
```

---

## Milestone 6: Independent Senior Code Review & Bug Hunt

### Summary of Audit & Verification

As an independent senior MERN stack code review, the entire codebase was systematically audited across controllers, models, middleware, frontend state synchronization, and test suites.

### 1. Confirmed Bugs Found & Resolved

1. **Analytics Data Mapping Duality (`adminAnalyticsController.js` & `AdminAnalytics.jsx`):**
   - **Root Cause:** In `backend/src/controllers/adminAnalyticsController.js`, sales analytics returned `{ summary, statusCounts, bestSellingItems, dailyTimeline }`, which was consumed by `AdminDashboard.jsx`. However, `AdminAnalytics.jsx` expected `{ kpis, ordersByStatus, topSellingItems, dailyTimeline }` where `dailyTimeline` items had `.date` and `.day`, and `topSellingItems` had `.totalQuantity`, `.estimatedCost`, and `.estimatedProfit`. This caused the detailed analytics page to render empty zeroes for KPIs and broken trend bars.
   - **Fix Applied:**
     - Enriched `adminAnalyticsController.js` to return dual-compatible keys: both `summary` and `kpis`, both `statusCounts` and `ordersByStatus`, both `bestSellingItems` and `topSellingItems` (with mapped profit and cost computations), and formatted `dailyTimeline` items with `_id`, `date`, `day`, `revenue`, and `orders`.
     - In `AdminAnalytics.jsx`, implemented resilient fallback normalization handling both schema variants (`summarySource.totalRevenue ?? summarySource.verifiedSales ?? 0`, etc.) ensuring graceful display across all date ranges (`today`, `7days`, `30days`, `custom`).
     - Added regression assertions to test 17 in `backend/tests/milestone3.test.js` verifying that `summary`, `kpis`, `statusCounts`, `ordersByStatus`, `bestSellingItems`, and `topSellingItems` are always provided.

2. **Cart Item Price Key Flexibility (`CartContext.jsx`):**
   - **Root Cause:** Cart total calculation strictly checked `i.sellingPrice`, which could evaluate to 0 if an item object passed from an external component or mock payload supplied `i.price` instead.
   - **Fix Applied:** Updated `totalPrice` in `CartContext.jsx` to use `(i.sellingPrice ?? i.price ?? 0) * i.qty`.

3. **Registration Form Single-Character Input Lockout (`RegisterPage.jsx`):**
   - **Root Cause:** In `frontend/src/pages/RegisterPage.jsx`, the input component `Field` was defined inside the `RegisterPage` component body. On every keystroke, `handleChange` triggered a re-render of `RegisterPage`. Because `Field` was re-allocated on each render, React's reconciliation algorithm treated it as a new component type and completely unmounted the underlying DOM `<input>` element. This immediately dropped focus after the first typed character, preventing natural typing of full names or words with spaces.
   - **Fix Applied:** Extracted `Field` to module-level scope as `FormField` outside `RegisterPage`, passing `value` and `onChange` as explicit props. The component identity remains stable across renders, allowing natural typing, spaces (e.g. `Nitin Rawat`), backspacing, selection, and editing in place.
   - **Verification:** Frontend production build passed (`npm run build:frontend`, Vite v8.3.4, 0 errors, 491 KB bundle) and full backend test suite executed (`npm test`, 51/51 tests passing).

### 2. Core Flows & Security Verified

- **Student Auth & Lifecycle:** Registration, password complexity validation, bcryptjs hashing, JWT generation, tamper rejection, and profile updating.
- **Atomic Inventory Deductions:** `orderController.js` executes atomic `$inc: { stockQuantity: -qty }` queries with rollback of preceding items upon concurrency collisions.
- **Order Cancellation & Stock Restoration:** `cancelOrder` checks cancellable states (`pending`, `confirmed`) atomically via `findOneAndUpdate({ _id, orderStatus: { $in: ['pending', 'confirmed'] } })` to strictly prevent double cancellation and double stock replenishment.
- **Payment Signature & Mismatch Verification:** Razorpay HMAC-SHA256 signatures are validated on the backend. Forged signatures and mismatched amounts are rejected with 400 Bad Request. Duplicate refunds are prevented via database checks.
- **Soft Deletion Integrity:** Admin food item deletion soft-deletes (`isDeleted: true`) if the item has past order history, preserving order references and reporting integrity while removing it from the student menu.
- **Security & Authorization:** Rate limiting active on authentication endpoints, Helmet HTTP security headers enabled, CORS restricted to designated origins, and non-admin access to `/api/admin/*` forbidden (403).

### 3. Tests & Builds Executed

- **Backend Test Suite:** Executed `npm test` running 51 integration tests across Milestones 2, 3, and 4 — **51 / 51 passed**.
- **Frontend Production Build:** Executed `npm run build:frontend` using Vite — **1998 modules transformed, 0 errors, 491 KB bundle**.

---

## Milestone 5 Audit & Local Browser Verification

### 1. Dev Server Status & Endpoint Health
- **Backend Service:** Running on port `5000` connected to MongoDB Atlas.
- **Frontend Service:** Running on port `5174` (port 5173 was retained by prior process) via Vite.
- **API Proxy:** Verified forwarding from `http://localhost:5174/api/*` to `http://localhost:5000/api/*`.
- **Health Endpoints:**
  - `GET http://localhost:5000/api/health` → `status: "healthy"`, `database: "connected"`, `uptimeSeconds > 0`.
  - `GET http://localhost:5174/api/health` → Successfully proxied with matching health status payload.
- **Menu API:** `GET http://localhost:5000/api/menu` returns 16 items with categories, prices, stock levels, and non-deleted flags.

### 2. Dependency & Configuration Hardening
- **Cloudinary Dependency:** Detected missing `cloudinary` in `backend/package.json` despite being referenced in `adminUploadController.js`. Installed `cloudinary@^2.11.0` in dependencies. Verified that without live credentials, image uploads cleanly fall back to local disk storage (`/uploads/`).
- **Admin Setup Secret:** Verified `ADMIN_SETUP_SECRET` environment variable in `.env.example` and `.env` template. Initial admin accounts are securely onboarded via `POST /api/auth/setup-admin` with token verification.
- **CORS Multi-Origin Support:** Updated `CLIENT_URL` to support comma-separated origins (`http://localhost:5173,http://localhost:5174`) in `server.js` and `.env`.

### 3. Student Registration & Name Input Verification
- **Code Audit:** Verified `FormField` in `frontend/src/pages/RegisterPage.jsx` is defined at module scope outside `RegisterPage`.
- **Typing Integrity:** Ensured state updates on `handleChange` do not remount the input DOM element or lose keyboard focus after typing single characters.
- **API Testing:** Executed student registration endpoint tests with full names containing spaces (`Alex Johnson`), verifying database persistence, hashing, and token generation.
- **Browser Automation Note:** The subagent's headless Playwright driver encountered an upstream CDN 404 (`playwright-1.57.0-win32_x64.zip` from AzureEdge). Rather than falsifying browser interaction results, the application has been prepared and verified for developer testing directly in standard local browsers.

### 4. External Integrations Status
| Integration | Status | Implementation Details |
|---|---|---|
| **MongoDB Atlas** | ✅ Verified | Connected live cluster, all 51 tests passed, seed data verified |
| **Razorpay Gateway** | 🟡 Sandbox Ready | Safe sandbox defaults (`rzp_test_*`), HMAC-SHA256 signature verification, frontend sandbox fallback modal for local demo without live keys |
| **Cloudinary** | 🟡 Fallback Active | Cloudinary SDK installed and loaded cleanly; falls back gracefully to local `/uploads/` if cloud keys are absent |
| **JWT Authentication** | ✅ Verified | HS256 token generation, expiration enforcement, tampering defense |

---

## Homepage Redesign — Premium Dark Food-Startup Experience

### 1. Visual & Layout Redesign (Matching Dark Reference Guide)
- **Sleek Framed Canvas:** Refactored `frontend/src/pages/HomePage.jsx` to feature an outer framed dark charcoal canvas (`#111214`) with rounded borders (`border: 1px solid rgba(242, 140, 69, 0.28); border-radius: 28px`), removing all dashboard-style panels.
- **Hero Section:**
  - Headline: *"Good Food. Zero Waiting."* rendered in luxury serif typography (`Playfair Display`, `font-serif-luxury`).
  - Short, engaging campus food-ordering description.
  - Buttons: Pill-shaped solid orange "Order Now" (`#F28C45`) and orange-accented "Create Account" link.
  - **Interactive 3-Item Thumbnail Slider:** Directly mirrors the attached reference with left/right circular arrow navigation, 3 rounded burger thumbnails with an orange triangle/caret indicator above the active item, slider indicator dots, and smooth transition between:
    1. Double Smash Cheeseburger (`/images/hero-burger-double.jpg`)
    2. The Ultimate Explosive Gourmet Burger (`/images/hero-burger-explosive.jpg`)
    3. Crispy Brioche Chicken Burger (`/images/hero-burger-crispy.jpg`)
  - **Large Floating Burger Showcase:** Right side features an ultra-detailed, hyper-realistic floating burger with a smooth 5s floating animation (`.animate-float`) and dark drop-shadow.
- **Featured Foods Section:**
  - Fetches 4–6 real database items from `/api/menu` (`fetchMenu()`).
  - Displays real prices (`₹{item.price}`), descriptions, dietary indicators (Veg/Non-Veg), and active Add to Cart controls.
- **How It Works Section:**
  - Minimalist 3-step dark cards (01 Explore Food, 02 Place an Order, 03 Pick It Up).
- **Final CTA & Footer:**
  - Headline: *"Your Next Favourite Meal Is Waiting."*
  - QuickBite branding, campus dining hall location (*Block B*), and canteen operating hours (*8:00 AM – 8:00 PM*).
  - No fabricated ratings, preparation times, or business statistics.

### 2. Navbar & Navigation Polish
- **Navbar (`Navbar.jsx`):**
  - QB logo, Home, Menu, How It Works, Sign In, and a prominent orange pill Register button (`#F28C45`).
  - Cart button with dynamic item count badge.
  - Mobile responsive hamburger menu drawer.
- **Bottom Navigation:**
  - Strictly limited to mobile viewports (`sm:hidden`), preventing any fixed bottom bar from cluttering desktop viewports.

### 3. Verification & Test Results
- **Frontend Production Build (`npm run build`):** ✅ **PASS** — Vite v8.3.4, 1999 modules transformed, 519.69 kB bundle, 0 errors.
- **Backend Test Suite (`npm test`):** ✅ **PASS** — **51 / 51 tests passing** (0 failures).
- **All Core Features Preserved:** Authentication, registration name input fix, cart persistence, order tracking, admin portal, and database connectivity.

---

## Production Deployment Guide

### Architecture
- **Frontend:** Static SPA built with Vite, deployable to Vercel, Netlify, or AWS S3 + CloudFront.
- **Backend API:** Node.js Express service running on Render, Railway, AWS ECS, or DigitalOcean App Platform.
- **Database:** MongoDB Atlas M0/M10 Cluster.
- **Media:** Cloudinary free/standard tier.

### Step-by-Step Deployment

1. **MongoDB Atlas Setup:**
   - Create a MongoDB Atlas cluster.
   - Whitelist the backend hosting IP range (or allow all `0.0.0.0/0` with strong authentication).
   - Create a database user and copy the connection string.

2. **Backend Deployment (e.g., Render / Railway):**
   - Root directory: `backend/`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Set environment variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `MONGODB_URI=<your_atlas_connection_string>`
     - `JWT_SECRET=<generated_64_char_hex_secret>`
     - `JWT_EXPIRES_IN=7d`
     - `ADMIN_SETUP_SECRET=<secure_admin_creation_token>`
     - `CLIENT_URL=https://your-frontend-app.vercel.app`
     - `RAZORPAY_KEY_ID=<your_razorpay_key>`
     - `RAZORPAY_KEY_SECRET=<your_razorpay_secret>`
     - `RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>`
     - `CLOUDINARY_CLOUD_NAME=<your_cloud_name>`
     - `CLOUDINARY_API_KEY=<your_api_key>`
     - `CLOUDINARY_API_SECRET=<your_api_secret>`

3. **Frontend Deployment (e.g., Vercel / Netlify):**
   - Root directory: `frontend/`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set environment variable:
     - `VITE_API_URL=https://your-backend-api.onrender.com/api`

4. **Post-Deployment Smoke Tests:**
   - Health check: Request `GET https://your-backend-api.onrender.com/health` (verify `status: "healthy"` and `database: "connected"`).
   - Seed database: Run `npm run seed` once against the production cluster.
   - Admin Login: Log in using `admin@quickbite.campus` / `AdminSecure123!`.
   - Student Checkout: Register an account, browse the menu, add items to cart, and place an order.

---

## Route Protection, Navigation Guards & Access Control Enforcement

### 1. Public Homepage & Navigation Restrictions
- **Public Homepage (`/`):** Retains the full Premium Dark design, luxury typography, floating burger showcase, and marketing content.
- **Unauthenticated Navbar:**
  - Before login, navbar strictly contains only: **QuickBite Logo**, **Home**, **Sign In**, and **Register**.
  - Student-only options (**Menu**, **How It Works**, **My Orders**, **Cart Button**) are removed from public navbar view.
  - Mobile bottom navigation (`BottomNav.jsx`) returns `null` for unauthenticated visitors, hiding Menu, Orders, Cart, and Profile links on mobile screens.
- **Hero & Action Button Guards:**
  - Clicking "Order Now", "Explore Full Menu", or CTA "Explore Menu" checks authentication state. Unauthenticated clicks display an informative notification (`Please sign in to browse and order from the canteen`) and navigate to `/login` with return destination `state: { from: { pathname: '/menu' } }`.
  - Featured food cards' "Add" button intercepts unauthenticated users, alerting them and redirecting to login.

### 2. Protected Student Routes
- **Route Guards in `App.jsx`:**
  - Wrapped student routes in reusable `<ProtectedRoute>`:
    - `/menu`
    - `/cart`
    - `/orders` and `/orders/:id`
    - `/checkout`
    - `/profile`
  - Unauthenticated visits immediately redirect to `/login` with `state: { from: location }`, preserving return destination.
  - While authentication state is resolving (`isLoading`), `ProtectedRoute` displays a dark-themed spinner to prevent redirect flicker.
- **Redirect for Authenticated Users on `/login` and `/register`:**
  - Logged-in students visiting `/login` or `/register` are automatically redirected to `location.state?.from?.pathname` or `/menu` (or `/admin` for administrators).
  - Preserved the name-input bug fix in `RegisterPage.jsx` (`FormField` defined strictly outside the component).

### 3. Student Layout After Authentication & Secure Logout
- **Post-Login Navigation:**
  - Displays authenticated student navigation: **Home**, **Menu**, **My Orders**, **Cart Button** with real-time badge count, and **User Profile** dropdown.
  - On mobile, `BottomNav` renders authenticated student controls.
- **Logout Flow:**
  - Clicking "Sign Out" invokes `handleLogout()`, which clears `qb_token` and `qb_cart_items` from `localStorage`, resets `AuthContext` state, resets `CartContext` state (`clearCart()`), and redirects to `/`.
  - Prevents stale cache access across user sessions.

### 4. Backend API Audit & Authorization Enforcement
- **Protected APIs:**
  - `GET /api/orders`, `POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/cancel` require valid JWT via `protect` middleware. Returns `401 Unauthorized` without token or with forged token.
  - `GET /api/auth/profile` and `PUT /api/auth/profile` require valid JWT token.
  - `GET /api/admin/*` routes strictly require both `protect` and `adminOnly` middlewares. Returns `401 Unauthorized` without token, and `403 Forbidden` if invoked by a student token.
- **Public APIs:**
  - `GET /health` and `GET /api/health` remain public for monitoring.
  - `GET /api/menu` remains accessible for the public homepage featured items showcase.

### 5. Verification & Test Suite Execution
- **Backend Test Suite (`npm test`):** ✅ **71 / 71 tests passing**
  - Milestone 2 Suite: 22 / 22 pass
  - Milestone 3 Suite: 18 / 18 pass
  - Milestone 4 Suite: 11 / 11 pass
  - Milestone Admin Suite: 20 / 20 pass
- **Frontend Production Build (`npm run build`):** ✅ **PASS** — Vite v8.3.4, 2000 modules transformed, 0 build errors.
- **API Access-Control Verification Script:** ✅ **PASS**
  - `GET /health` -> 200 OK
  - `GET /api/menu` -> 200 OK
  - `GET /api/orders` (no token) -> 401 Unauthorized
  - `POST /api/orders` (no token) -> 401 Unauthorized
  - `GET /api/auth/profile` (no token) -> 401 Unauthorized
  - `GET /api/admin/orders` (no token) -> 401 Unauthorized
  - `GET /api/admin/orders` (with student token) -> 403 Forbidden
  - `GET /api/orders` (with student token) -> 200 OK
  - `GET /api/admin/orders` (with admin token) -> 200 OK
  - `GET /api/orders` (with invalid/tampered token) -> 401 Unauthorized

---

## Milestone: Secure Admin Panel, Role Selection & Operations

### 1. Registration Role Selection — Secure Implementation
- **Two Account Options in Frontend:** `RegisterPage.jsx` provides an interactive account-type selector between:
  - `Student / User`
  - `Admin`
- **Zero Automatic Privilege Escalation:** Selecting "Admin" does not grant administrator privileges.
  - When "Admin" is selected, an amber security warning banner explains that administrator access requires authorization.
  - An **Admin Invitation / Authorization Key** input field (`reg-invite-code`) is required.
  - Submitting without a valid invitation or setup token fails on the frontend and is rejected with `403 Forbidden` on the backend.
- **Server-Side Security Guarantees:**
  - `POST /api/auth/register` strictly forces `role: 'student'` and completely ignores any client-supplied `role` parameter.
  - `PUT /api/auth/profile` strictly forbids modifying `user.role`.
- **Dynamic Single-Use Invitation System:**
  - Created `AdminInvite` Mongoose model storing `code` (`qb_inv_...`), `createdBy`, `invitedEmail`, `expiresAt` (default 48 hours), `isUsed`, `usedBy`, and `usedAt`.
  - Authorized admins can generate invitations via `POST /api/admin/invites` and view generated invitations via `GET /api/admin/invites`.
  - `setupAdmin` in `authController.js` validates that the invitation is not expired and has not already been used. Upon successful account creation, the invitation is immediately marked as `isUsed: true` with a timestamp and user reference, preventing replay or reuse.
- **First-Admin Server Provisioning CLI:**
  - Added `backend/src/scripts/provisionAdmin.js` runnable via `npm run setup:admin`.
  - Supports generating a single-use invitation code (`npm run setup:admin -- --invite`) or directly provisioning an admin account (`npm run setup:admin -- --name "..." --email "..." --password "..."`).
  - No production admin passwords are ever hardcoded in the frontend or public repositories.

### 2. Admin Authentication & Route Protection
- Dedicated route `/admin` wrapped in reusable `<AdminRoute>` component in `App.jsx`.
- Unauthenticated users attempting to access `/admin` are redirected to `/login` with location memory.
- Authenticated students attempting to access `/admin` see a branded Access Restricted card with a button returning to the student menu.
- All backend admin endpoints under `/api/admin/*` are protected with `router.use(protect, adminOnly)`.

### 3. Category Management
- Dedicated Category Management page at `/admin/categories` and in the Admin sidebar navigation.
- Authorized admins can:
  - View all categories with assigned food item counts, slug, icon, description, and status.
  - Create new categories with auto-slug generation, icon picker, and sort order.
  - Edit existing category attributes and toggle active status.
  - Safely delete categories: If active food items are assigned to the category, deletion is prevented with a clear explanation and safe alternative instructions (reassign or deactivate).

### 4. Admin Dashboard & Sidebar UI
- QuickBite premium dark palette strictly maintained: Background `#111214`, Cards `#1D2025`, Accent `#F28C45`, Text `#F5F5F5`.
- Desktop sidebar & mobile responsive drawer with items:
  - **Overview** (`/admin`)
  - **Food Management** (`/admin/food`)
  - **Categories** (`/admin/categories`)
  - **Orders** (`/admin/orders`)
  - **Inventory** (`/admin/inventory`)
  - **Sales & Analytics** (`/admin/analytics`)
  - **Logout**
- Overview Cards with actual MongoDB database metrics:
  - **Total Orders:** Lifetime order count from MongoDB.
  - **Today's Orders:** Orders placed today.
  - **Pending Orders:** Orders currently in pending state awaiting preparation.
  - **Completed Orders:** Orders successfully picked up and finalized.
  - **Low-Stock Items:** Items at or below low-stock threshold.
  - **Verified Sales:** Net revenue from paid/completed orders with clear distinction from unpaid orders.

### 5. Order Management
- Real-time kitchen view with 10-second polling.
- Displays Order ID, Pickup Token, Student Name, Campus Email, Phone Number, Items & Quantities, Subtotal, Payment Method & Status, Order Status, and Timestamps.
- Search and filtering by status and date (All Dates, Today, Past 7 Days, Specific Date).
- Enforces valid status transitions on the backend (`pending` → `confirmed` → `preparing` → `ready_for_pickup` → `completed`).
- Safe cancellation with inventory replenishment; double cancellation strictly prevented.

### 6. Inventory Management
- Dedicated stock tracking view displaying current quantities, low-stock alerts, out-of-stock items, and estimated inventory valuation.
- Quick stock and low-stock threshold adjustments.
- Backend validates non-negative stock and thresholds (`400 Bad Request` if negative).

### 7. Sales & Analytics
- Visualizes verified sales (refunds deducted), estimated Cost of Goods Sold (COGS), estimated gross profit margin, daily timeline, and best-selling items.
- Clearly distinguishes paid/verified orders from unpaid orders. Does not misrepresent unpaid orders as verified revenue.

### 8. Integration Test Verification
- All 71 automated tests passing across 4 integration suites:
  - `milestone2.test.js`: 22 tests passing
  - `milestone3.test.js`: 18 tests passing
  - `milestone4.test.js`: 11 tests passing
  - `milestoneAdmin.test.js`: 20 tests passing
- Zero external test dependencies (`node:test`).
- Frontend production bundle built cleanly via Vite (`npm run build`).
