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