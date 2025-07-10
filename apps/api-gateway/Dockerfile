# Build base dependencies
FROM node:23.10.0-alpine AS base
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY nx.json tsconfig.base.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy shared packages and generate Prisma
COPY packages ./packages
COPY prisma ./prisma
RUN npx prisma generate

# Clean up to reduce size
RUN npm cache clean --force

# Build stage
FROM node:23.10.0-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/api-gateway ./apps/api-gateway
COPY packages ./packages
COPY prisma ./prisma

# Build the service
RUN npx nx build api-gateway

# Production stage
FROM node:23.10.0-alpine AS production
WORKDIR /app

# Copy from base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port and start
EXPOSE 8080
CMD ["node", "dist/apps/api-gateway/main.js"]
