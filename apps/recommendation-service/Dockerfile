# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate

# Create a standalone package.json without workspace dependencies
COPY <<EOF package.json
{
  "name": "recommendation-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "start": "node dist/main.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "tslib": "^2.6.0",
    "typescript": "^5.0.0",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6",
    "path": "^0.12.7",
    "@prisma/client": "^6.7.0",
    "prisma": "^6.7.0",
    "@tensorflow/tfjs": "^4.15.0",
    "@tensorflow/tfjs-backend-cpu": "^4.15.0"
  }
}
EOF

# Copy workspace packages as local modules
COPY packages/error-handler ./node_modules/@eshop/error-handler
COPY packages/libs/prisma ./node_modules/@eshop/prisma
COPY packages/middleware ./node_modules/@eshop/middleware
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --prod
RUN pnpm add tslib@^2.6.0 -w

# Generate Prisma client
RUN pnpm prisma generate

# Copy pre-built application
COPY apps/recommendation-service/dist ./dist

# ---- Production Stage ----
FROM node:20-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy everything from builder
COPY --from=builder --chown=nodejs:nodejs /app ./

USER nodejs

EXPOSE 6007
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]