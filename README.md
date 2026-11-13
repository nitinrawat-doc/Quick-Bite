# QuickBite 🍔

**Online Campus Canteen Ordering & Operations Management Platform**

QuickBite is a high-performance full-stack MERN web application designed for campus canteens. It bridges student ordering and kitchen operations with real-time tracking, atomic inventory reservation, secure online payments (Razorpay Live & Test modes with UPI Intent & Dynamic QR), and business analytics.

---

## 🐳 Quick Start with Docker (Run on Any Laptop in 2 Minutes)

You can run the entire application on **any laptop** (Mac, Windows, Linux) with **only Docker Desktop installed**. No Node.js, npm dependencies, or local MongoDB installation required!

### Setup on Another Laptop:

#### 1. Prerequisites
- **Git:** [Download Git](https://git-scm.com/)
- **Docker Desktop:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (ensure Docker Desktop is running)

#### 2. Clone the Repository
```bash
git clone https://github.com/nitinrawat-doc/Quick-Bite.git
cd Quick-Bite
```

#### 3. Configure MongoDB Atlas & Environment Variables
QuickBite uses **MongoDB Atlas** (cloud database). Before running the app, ensure your Atlas cluster allows connections from your current network:
1. Open [MongoDB Atlas](https://cloud.mongodb.com/) -> **Network Access**.
2. Click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** or add your current IP address.

Create your `.env` file from the provided template:
```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` and fill in your values (at minimum, `MONGODB_URI` and `JWT_SECRET`):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/quickbite?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
ADMIN_SETUP_SECRET=quickbite_admin_setup_secret_2026

# Optional: Razorpay payment gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Optional: Cloudinary image hosting (falls back to local persistent volume if empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

#### 4. Build and Start the Application
```bash
docker compose up --build -d
```

#### 5. Open in Browser
- **Frontend Web App:** [http://localhost:5173](http://localhost:5173) (or `http://localhost:80`)
- **Backend API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📋 Docker Management Commands

| Action | Command |
|---|---|
| **Start in background** | `docker compose up -d` |
| **Rebuild & start** | `docker compose up --build -d` |
| **View real-time logs** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **View frontend logs only** | `docker compose logs -f frontend` |
| **Check container status** | `docker compose ps` |
| **Stop containers** | `docker compose stop` |
| **Stop and remove containers** | `docker compose down` |
| **Stop and remove volumes** | `docker compose down -v` |
| **Seed database inside container** | `docker compose exec backend node src/seed/seedData.js` |

---

## 🏗️ Docker Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Host Browser                      │
│                  http://localhost:5173                 │
└───────────────────────────┬────────────────────────────┘
                            │ (Port 5173 / 80)
┌───────────────────────────▼────────────────────────────┐
│              quickbite-frontend (Nginx Alpine)         │
│  - Serves static React 19 / Vite SPA production assets │
│  - Handles SPA routing (index.html fallback)           │
│  - Reverse-proxies /api/* to http://backend:5000/api/* │
│  - Reverse-proxies /uploads/* to http://backend:5000   │
└───────────────────────────┬────────────────────────────┘
                            │ (Docker Bridge Network: quickbite_network)
┌───────────────────────────▼────────────────────────────┐
│              quickbite-backend (Node 20 Alpine)        │
│  - Express 5 REST API (Port 5000)                      │
│  - JWT Auth, Razorpay HMAC-SHA256, Order Stepper       │
│  - Persistent local uploads volume (backend-uploads)   │
└───────────────────────────┬────────────────────────────┘
                            │ (SSL/TLS outbound connection)
┌───────────────────────────▼────────────────────────────┐
│            MongoDB Atlas Cloud Database                │
│             (mongodb+srv://cluster0...)                │
└────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 🎓 Student Experience
- **Authentication & Security:** Registration with password complexity meter, secure JWT authentication, session recovery across reloads, and student profile editor.
- **Dynamic Food Catalog:** Categorized menu loaded directly from MongoDB with search, filters, and live stock status.
- **Persistent Cart & Atomic Checkout:** LocalStorage-backed cart, server-side price recalculation (ignoring client prices), and atomic inventory deduction with rollback.
- **Flexible Payments:** Pay at Canteen Counter or Online Payment via Razorpay Gateway (UPI Intent, Dynamic QR, Cards, NetBanking).
- **Live Order Tracking:** 5-stage status stepper (`pending` → `confirmed` → `preparing` → `ready_for_pickup` → `completed`) with 6-second polling and cancellation with inventory restoration.

### 🛡️ Admin Dashboard & Kitchen Operations
- **Role-Based Security:** Public registration strictly forces `student` role; admin creation requires `ADMIN_SETUP_SECRET`; protected with `adminOnly` backend middleware and `<AdminRoute>` frontend guards.
- **Menu Management:** Full CRUD for categories and food items with dual MIME/extension validated image uploading (5MB limit, Cloudinary + local persistent fallback).
- **Kitchen Fulfillment:** Incoming orders monitor with polling, valid status transitions, and audit logging.
- **Payment & Refund Ledger:** Complete transaction log with controlled refund processing, over-refund prevention, and duplicate refund guards.
- **Sales Analytics:** MongoDB aggregation pipelines generating net verified sales, COGS, gross profit, and daily revenue timeline.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7 | Responsive SPA served via Nginx reverse-proxy |
| **Backend** | Node.js v20/v22, Express 5 | RESTful API with Helmet, RateLimiter & Morgan |
| **Database** | MongoDB Atlas, Mongoose v9 | Cloud database with connection caching & auto-reconnect |
| **Containerization** | Docker, Docker Compose, Nginx Alpine | Multi-stage builds, non-root user, health checks |
| **Auth** | JWT (`jsonwebtoken`), bcryptjs | Bearer token authentication with role-based authorization |
| **Payments** | Razorpay Sandbox / Production | UPI Intent on mobile, Dynamic QR on desktop, HMAC-SHA256 verification |
| **Media** | Multer, Cloudinary | 5MB size limit with persistent local Docker volume fallback |
| **Testing** | Node.js Native Test Runner (`node:test`) | 71 automated integration tests |

---

## ⚙️ Manual Local Development (Without Docker)

If you prefer running without Docker on your development machine:

### 1. Prerequisites
- **Node.js:** v18.x or later (v22 recommended)
- **MongoDB Atlas** or local MongoDB instance

### 2. Installation
```bash
npm run install:all
```

### 3. Environment Configuration
```bash
cp backend/.env.example backend/.env
```

### 4. Database Seeding & Admin Provisioning
```bash
# Seed 16 initial menu items and default admin
npm run seed
# Default Admin: admin@quickbite.campus / AdminSecure123!

# Generate time-limited (48h) single-use admin invitation code
npm run setup:admin -- --invite
```

### 5. Run Automated Tests
```bash
npm test
```

### 6. Start Development Servers
```bash
npm run dev
# OR:
npm run dev:backend   # Express API on port 5000
npm run dev:frontend  # Vite React App on port 5173
```

---

## 🔧 Troubleshooting Docker Deployment

### 1. Backend container shows `MongoDB connection error: connection timed out`
- **Root Cause:** MongoDB Atlas has not whitelisted the outgoing IP address of your laptop or network.
- **Fix:** Go to [cloud.mongodb.com](https://cloud.mongodb.com/) -> **Network Access** -> **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** (or add your current IP address) and wait 1 minute for Atlas to apply the change.

### 2. Port conflict: `Bind for 0.0.0.0:5173 failed: port is already allocated`
- **Root Cause:** A local Vite server or another app is running on port 5173.
- **Fix:** Change `FRONTEND_PORT` in your `.env` file:
  ```env
  FRONTEND_PORT=3000
  ```
  Then restart with `docker compose up -d`. Access the frontend at [http://localhost:3000](http://localhost:3000).

### 3. Changes to code aren't showing up
- **Root Cause:** Docker is using a cached build layer.
- **Fix:** Rebuild the images without cache:
  ```bash
  docker compose build --no-cache
  docker compose up -d
  ```

### 4. Viewing container error logs
```bash
# Check status of both containers
docker compose ps

# View the last 100 log lines from backend
docker compose logs --tail=100 backend
```

---

## 🔒 Security Architecture

1. **Role Escalation Prevention:** Public registration ignores requested roles and forces `role: 'student'`. Admin creation requires an environment-backed `ADMIN_SETUP_SECRET`.
2. **Server-Side Pricing:** Cart totals are recalculated by the backend from database prices; client-provided prices are ignored.
3. **Atomic Inventory Decrement:** Uses Mongoose `findOneAndUpdate` with `$inc` and `$gte` conditions to prevent race conditions during concurrent checkouts.
4. **Payment Cryptographic Validation:** Verifies Razorpay HMAC-SHA256 signatures before confirming orders or webhooks.
5. **Non-Root Docker Execution:** The backend container runs under a dedicated `node` non-root user (UID 1000).
6. **No Exposed Secrets:** Database credentials, JWT secrets, and payment keys are injected via environment variables and never baked into Docker images.

---

## License
ISC
