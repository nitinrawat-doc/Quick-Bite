# QuickBite — Demonstration & Presentation Checklist

This checklist provides a structured, end-to-end walkthrough for demonstrating **QuickBite** to evaluators, stakeholders, or examiners.

---

## 📋 Pre-Demo Setup (2 Minutes)

### 1. Verify Prerequisites
- Node.js `v18.x` or higher (`node -v`)
- Local MongoDB running on `127.0.0.1:27017` (or MongoDB Atlas URI in `.env`)

### 2. Configure Environment
Ensure `backend/.env` exists with valid configuration:
```bash
cp backend/.env.example backend/.env
```
Ensure key properties are set:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickbite
JWT_SECRET=quickbite_secure_demo_secret_2026_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_SETUP_SECRET=quickbite_super_admin_setup_secret_2026
```

### 3. Seed Fresh Demo Catalog & Admin
Run the idempotent seed script to populate 16 items across 7 categories and the verified administrator account:
```bash
npm run seed
```

**Pre-Configured Demo Credentials:**
| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@quickbite.campus` | `AdminSecure123!` | Full kitchen & business admin |
| **Test Student** | Create via `/register` or use existing | Any strong password | Menu, Cart, Orders, Tracking |

### 4. Start Development Servers
Open two terminal windows:
```bash
# Terminal 1 — Backend API
npm run dev:backend

# Terminal 2 — Frontend Application
npm run dev:frontend
```

---

## 🎬 Live Demonstration Script (Step-by-Step)

### Step 1: Health Check & System Status (30 seconds)
1. Open browser to `http://localhost:5000/health` (or `/api/health`).
2. **Point out:**
   - `"status": "healthy"`
   - `"database": "connected"`
   - Real-time server uptime in seconds.

---

### Step 2: Student Discovery & Catalog Browsing (1 minute)
1. Navigate to `http://localhost:5173/`.
2. **Demonstrate Category Filters:** Click on *Burgers*, *Pizzas*, *Momos*, *Beverages*. Notice instantaneous catalog filtering.
3. **Demonstrate Debounced Text Search:** In the search bar, type `Paneer` or `Cold`. Notice the results update seamlessly with zero jarring page reloads.
4. **Point out Stock Badges:** Point out items with low stock warnings (e.g. *Only 4 left!*) and out-of-stock items (*Sold Out* with disabled cart buttons).

---

### Step 3: Persistent Cart & Quantity Controls (1 minute)
1. Click **+ Add** on 2 different food items.
2. Open the Cart Drawer from the top-right navbar button.
3. Increment and decrement quantities; observe subtotal calculations.
4. **Demonstrate Persistence:** Refresh the browser (`F5`). Open the cart again — notice the items, quantities, and price remain completely intact in `localStorage`.

---

### Step 4: Checkout & Atomic Inventory Reservation (2 minutes)
1. Click **Proceed to Checkout**. If not logged in, you will be redirected to `/login` with an intuitive redirection state.
2. Click **Create an Account** and register a new student account (e.g., `rahul.verma@campus.edu`).
3. Notice the live password complexity meter validating security requirements.
4. Return to Checkout.
5. **Select Payment Method:**
   - **Option A (Counter Payment):** Select *Pay at Canteen Counter (Cash / UPI)*.
   - **Option B (Razorpay Sandbox):** Select *Razorpay Online Gateway*. (If test keys are active, the gateway popup opens; if sandbox placeholder keys are used, the informative sandbox reservation modal appears).
6. Click **Confirm & Place Order**.
7. **Point out:**
   - Unique Order Identifier (e.g., `QB-261010-4821`).
   - Counter Pickup Token (e.g., `Token #492`).
   - Server-side inventory decrement: Stock in MongoDB was atomically decremented. Client-tampered prices are strictly ignored.

---

### Step 5: Real-Time Order Tracking & Stepper (1 minute)
1. Observe the live 5-stage visual progress stepper on the tracking screen (`/orders/:id`):
   `Order Placed` → `Confirmed` → `Preparing` → `Ready for Pickup` → `Collected`.
2. Point out the active 6-second polling heartbeat keeping the student up-to-date with kitchen progress.
3. Test the **Cancel Order** button (available while in Pending or Confirmed state).
   - Enter a cancellation reason (e.g., "Change of plans").
   - Click Confirm: the status updates to `Cancelled`, and reserved stock is immediately restored back to the food item's inventory.

---

### Step 6: Admin Operations & Kitchen Fulfillment (2 minutes)
1. Sign in as Admin using `admin@quickbite.campus` / `AdminSecure123!`.
2. Notice the instant redirection to `/admin` and the **Admin Portal** badge appearing in the navbar.
3. Navigate to **Kitchen Orders** (`/admin/orders`):
   - Locate the student's recent order.
   - Click through the progression buttons: **Accept Order** (`confirmed`) → **Start Cooking** (`preparing`) → **Mark Ready** (`ready_for_pickup`) → **Complete Pickup** (`completed`).
   - Open a second browser tab as the student: observe the student's screen update automatically without manual refresh!

---

### Step 7: Food & Category Management CRUD (1.5 minutes)
1. Navigate to **Menu Management** (`/admin/food`).
2. Click **+ Add Food Item**:
   - Enter Name, Description, Category, Selling Price (₹), and Cost Price (₹).
   - Set Stock Quantity and Low-Stock Alert Threshold.
   - Select an image: observe the live image preview before upload.
   - Submit: item is instantly created and appears on the student menu.
3. **Demonstrate Availability Toggle:** Toggle an item to *Unavailable*. Switch to the student menu tab: notice the item instantly greys out as unavailable.
4. **Demonstrate Historical Order Soft-Delete:** Try deleting an item that has past order history. The backend safely flags it as `isDeleted: true` instead of a hard delete, preserving historical receipts and past order integrity.

---

### Step 8: Payment Ledger & Refunds (1 minute)
1. Navigate to **Payments & Refunds** (`/admin/payments`).
2. Filter transactions by status (`completed`, `pending`, `refunded`).
3. Click **Issue Refund** on a completed payment:
   - Enter refund reason and verify the amount cannot exceed the eligible captured payment.
   - Confirm refund: order status synchronizes to `refunded`, duplicate refund attempts are rejected, and an immutable audit trail is logged.

---

### Step 9: Sales Analytics & Gross Profit Accounting (1.5 minutes)
1. Navigate to **Sales Analytics** (`/admin/analytics`).
2. Switch date range filters: **Today**, **Last 7 Days**, **Last 30 Days**, and **Custom Date Range**.
3. Point out the MongoDB aggregation metrics:
   - **Net Verified Sales:** Gross sales minus approved refunds. Unpaid and cancelled orders are excluded.
   - **Estimated COGS (Cost of Goods Sold):** Computed from ingredient cost price snapshots recorded at the time of each order.
   - **Estimated Gross Profit:** Net Sales minus COGS.
   - **Financial Disclosure Note:** Clearly identifies gross profit as an estimate excluding canteen operating expenses (salaries, utilities, kitchen rent).
   - **Daily Revenue Bar Chart:** Interactive visual breakdown of daily revenue and order volumes.
   - **Best-Selling Items Table:** Ranked by units sold and revenue contribution.

---

## 🛠️ Common Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| **Backend error: `EADDRINUSE: 5000`** | Another process is using port 5000. | Run `npx kill-port 5000` or change `PORT=5001` in `backend/.env`. |
| **MongoDB error: `ECONNREFUSED`** | Local MongoDB service is not started. | Run `mongod --dbpath <data_dir> --port 27017` or use MongoDB Atlas. |
| **Frontend displays "Failed to fetch menu"** | Backend server is not running or proxy issue. | Ensure `npm run dev:backend` is running and check terminal output. |
| **403 Forbidden on `/admin/*`** | Logged in with student account. | Log in with `admin@quickbite.campus` / `AdminSecure123!`. |
| **Image upload fails** | File exceeds 5MB or invalid MIME type. | Upload a JPEG, PNG, or WebP image under 5MB. |

---

## 🧪 Automated Test Verification

To demonstrate automated quality assurance, run:
```bash
npm test
```
All **51 integration tests** will execute and report passing:
- Milestone 2 Suite: 22 tests (Auth, Menu, Checkout, Pricing, Concurrency)
- Milestone 3 Suite: 18 tests (Admin CRUD, Razorpay HMAC, Webhooks, Refunds, Analytics)
- Milestone 4 Suite: 11 tests (Health, Security, NoSQL robustness, Payment sync, Soft deletes)
