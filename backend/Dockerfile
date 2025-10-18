# Use Node.js LTS version
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Build stage for production
FROM base AS builder
WORKDIR /app

RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm ci
COPY . .

# Generate Prisma client
RUN npx prisma generate

# For now, skip TypeScript compilation and run directly with tsx
# RUN npx tsc --skipLibCheck --noEmitOnError false || echo "Build completed with warnings"

# Production stage
FROM base AS production
WORKDIR /app

# Install curl and openssl-dev for health checks and Prisma compatibility
RUN apk add --no-cache curl openssl-dev

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./

# Fix Prisma permissions
RUN chown -R nodejs:nodejs /app/node_modules/.prisma

# Set correct permissions
USER nodejs

# Set environment variable to force Prisma to use the correct binary
ENV PRISMA_QUERY_ENGINE_LIBRARY="/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application with tsx (TypeScript execution)
CMD ["npx", "tsx", "src/index.ts"]