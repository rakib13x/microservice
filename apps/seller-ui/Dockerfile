# Dependencies stage
FROM node:23.10.0-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/seller-ui/package.json ./apps/seller-ui/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Builder stage
FROM node:23.10.0-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/nx.json ./
COPY --from=deps /app/tsconfig.base.json ./

# Copy source code
COPY apps/seller-ui ./apps/seller-ui
COPY packages ./packages

# Build the application
RUN npx nx build seller-ui

# Production stage
FROM node:23.10.0-alpine AS production
WORKDIR /app

# Install only production dependencies for Next.js
RUN npm install next@15.1.4 react@19.0.0 react-dom@19.0.0 --only=production

# Copy built application
COPY --from=builder /app/dist/apps/seller-ui ./

# Expose port and start
EXPOSE 3001
CMD ["npm", "start"]
