# ─── QuickBite Frontend Dockerfile ─────────────────────────────────────────────
# Multi-stage production build: Vite build -> Nginx Alpine reverse-proxy
# ──────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Build React Application ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using package-lock.json for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL=""
ARG VITE_RAZORPAY_KEY_ID=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Compile production bundle into /app/dist
RUN npm run build

# ─── Stage 2: Production Nginx Server ──────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Install wget for Docker healthcheck
RUN apk --no-cache add wget

# Copy custom Nginx configuration (handles SPA routing + API reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check against Nginx health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]

