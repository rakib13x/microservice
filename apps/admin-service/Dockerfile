# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and workspace configuration
COPY apps/admin-service/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy workspace packages that admin-service depends on
COPY packages/error-handler ./packages/error-handler
COPY packages/libs/prisma ./packages/libs/prisma

# Copy prisma schema
COPY prisma ./prisma

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN pnpm install --prod
RUN pnpm add tslib@^2.6.0 -w

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY apps/admin-service/dist ./dist

# ---- Production Stage ----
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose the correct port
EXPOSE 6005

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "dist/main.js"]