# ─── QuickBite Backend Dockerfile ──────────────────────────────────────────────
# Production-ready, multi-stage, secure container for Express + MongoDB Atlas API
# ──────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Dependency Installation ─────────────────────────────────────────
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install dependencies using package-lock.json for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install wget for Docker healthcheck
RUN apk --no-cache add wget

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./

# Copy application source code
COPY server.js ./
COPY src ./src
COPY vercel.json ./

# Create uploads directory and grant ownership to non-root node user
RUN mkdir -p uploads && chown -R node:node /app

# Security: Run as non-root user
USER node

# Expose backend port
EXPOSE 5000

# Health check against QuickBite API health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start Express server
CMD ["node", "server.js"]

