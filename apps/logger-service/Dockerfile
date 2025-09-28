# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY apps/logger-service ./apps/logger-service

# Install dependencies and build
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
RUN pnpm install
RUN npx prisma generate
RUN pnpm --filter logger-service run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install production dependencies AS ROOT
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate && pnpm install --prod

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/logger-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Generate Prisma client AS ROOT before switching users
RUN npx prisma generate

# Fix permissions for nodejs user after generation
RUN chown -R nodejs:nodejs /app/node_modules/.prisma || true
RUN chown -R nodejs:nodejs /app/node_modules/.pnpm/@prisma* || true

# Switch to non-root user
USER nodejs

EXPOSE 6008

# Direct execution since no entrypoint script needed
CMD ["dumb-init", "node", "dist/main.js"]
