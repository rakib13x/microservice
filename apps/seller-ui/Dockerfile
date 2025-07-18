# 1. Install dependencies for seller-ui only
FROM node:20-alpine AS deps
WORKDIR /repo
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./
COPY ../../pnpm-lock.yaml ./
COPY ../../apps/seller-ui/package.json ./apps/seller-ui/
COPY ../../packages/components/package.json ./packages/components/
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN pnpm install --frozen-lockfile

# 2. Build the app
FROM node:20-alpine AS builder
WORKDIR /repo
COPY --from=deps /repo ./
COPY ../../ ./
ENV NX_DAEMON=false
ENV NX_PLUGIN_NO_TIMEOUTS=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NX_SKIP_NX_CACHE=true
RUN corepack enable && corepack prepare pnpm@8.10.2 --activate
RUN npx prisma generate
RUN npx nx build seller-ui --skip-nx-cache

# 3. Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/seller-ui/.next/standalone/apps/seller-ui/.next ./.next
COPY --from=builder /repo/apps/seller-ui/.next/standalone/apps/seller-ui/package.json ./package.json
COPY --from=builder /repo/apps/seller-ui/.next/standalone/apps/seller-ui/server.js ./server.js
COPY --from=builder /repo/apps/seller-ui/.next/standalone/node_modules ./node_modules
COPY --from=builder /repo/apps/seller-ui/public ./public
EXPOSE 3001
CMD ["node", "server.js"]