# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/product-service/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN pnpm install --prod
RUN pnpm add tslib@^2.6.0 -w

RUN npx prisma generate

COPY apps/product-service/dist ./dist

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 6002

CMD ["node", "dist/main.js"]