# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/seller-service/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages/error-handler ./packages/error-handler
COPY packages/libs/prisma ./packages/libs/prisma
COPY packages/libs/redis ./packages/libs/redis
COPY packages/middleware ./packages/middleware
COPY packages/utils/logs ./packages/utils/logs
COPY prisma ./prisma

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN pnpm install --prod

# Generate Prisma client
RUN npx prisma generate

# Copy built application from service directory
COPY apps/seller-service/dist ./dist

# ---- Production Stage ----
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and built app from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 6004

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]