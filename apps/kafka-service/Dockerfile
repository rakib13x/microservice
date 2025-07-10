# Build base dependencies
FROM node:23.10.0-alpine AS base
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY nx.json tsconfig.base.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy shared packages and generate Prisma
COPY packages ./packages
COPY prisma ./prisma
RUN npx prisma generate

# Clean up to reduce size
RUN npm cache clean --force

# Build stage
FROM node:23.10.0-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/kafka-service ./apps/kafka-service
COPY packages ./packages
COPY prisma ./prisma

# Build the application
RUN npx nx build kafka-service --prod

# Production stage
FROM node:23.10.0-alpine AS production
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/kafka-service ./
COPY --from=base /app/node_modules ./node_modules

# Expose port and start
EXPOSE 6007
CMD ["node", "main.js"]
