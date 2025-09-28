# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY apps/product-service ./apps/product-service

# Copy and fix entrypoint script
COPY apps/product-service/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh

# Install dependencies and build
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
RUN pnpm install
RUN npx prisma generate
RUN pnpm --filter product-service run build

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

# Copy built application and scripts
COPY --from=builder --chown=nodejs:nodejs /app/apps/product-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Generate Prisma client AS ROOT before switching users
RUN npx prisma generate

# Fix permissions for nodejs user after generation
RUN chown -R nodejs:nodejs /app/node_modules/.prisma || true
RUN chown -R nodejs:nodejs /app/node_modules/.pnpm/@prisma* || true

# Ensure script is executable with correct line endings
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Switch to non-root user
USER nodejs

EXPOSE 6002

ENTRYPOINT ["./entrypoint.sh"]
