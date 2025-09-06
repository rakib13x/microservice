# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only required files
COPY apps/order-service/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy only dependent workspace packages
COPY packages/libs/prisma ./packages/libs/prisma
COPY packages/middleware ./packages/middleware
COPY packages/error-handler ./packages/error-handler
COPY prisma ./prisma

# Install pnpm & deps
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
RUN pnpm install --prod

# Copy the built application
COPY apps/order-service ./dist
COPY apps/order-service/entrypoint.sh ./entrypoint.sh

# ---- Production Stage ----
FROM node:20-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built service & deps
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./entrypoint.sh

USER nodejs

EXPOSE 6003

# Start app with entrypoint (similar to product-service)
ENTRYPOINT ["./entrypoint.sh"]
