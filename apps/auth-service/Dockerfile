# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only necessary package files
COPY apps/auth-service/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy workspace packages that auth-service actually needs
COPY packages/error-handler ./packages/error-handler
COPY packages/libs/prisma ./packages/libs/prisma
COPY packages/libs/redis ./packages/libs/redis
COPY packages/middleware ./packages/middleware
COPY packages/utils/logs ./packages/utils/logs
COPY prisma ./prisma

# Enable pnpm and install only production dependencies
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN pnpm install --prod
RUN npm install tslib@^2.6.0

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY apps/auth-service/dist ./dist

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Install only essential system dependencies
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy from builder with correct ownership
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Switch to non-root user
USER nodejs

EXPOSE 6001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
