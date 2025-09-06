# ---- Builder Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY apps ./apps

# Install all workspace dependencies + jest types
RUN pnpm install --frozen-lockfile \
    && pnpm add -D @types/jest -w


# Generate Prisma client (optional)
RUN npx prisma generate

# Build with Nx (or Next directly)
RUN npx nx build user-ui
# or: RUN pnpm --filter user-ui build

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy the standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/user-ui/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/apps/user-ui/.next/static ./apps/user-ui/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/user-ui/public ./apps/user-ui/public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/user-ui/server.js"]
