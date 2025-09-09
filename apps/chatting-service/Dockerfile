# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configs + tsconfigs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./ 
COPY tsconfig.base.json tsconfig.json ./
COPY prisma ./prisma
COPY packages ./packages

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Install root deps
RUN pnpm install --frozen-lockfile

# Copy chatting-service app
COPY apps/chatting-service ./apps/chatting-service

# Install app-specific deps
RUN pnpm --filter chatting-service install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter chatting-service prisma generate

# Build chatting-service
RUN pnpm --filter chatting-service run build -- --skip-nx-cache

# ---- Production Stage ----
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/chatting-service/dist ./dist
COPY --from=builder /app/apps/chatting-service/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/packages ./packages


RUN npx prisma generate
# Use the official non-root user that exists in the node image
USER node

EXPOSE 6006
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
