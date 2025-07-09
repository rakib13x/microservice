# Multi-stage build for smaller images
FROM node:23.10.0-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --only=production
COPY packages ./packages
COPY prisma ./prisma
RUN npx prisma generate

# This becomes the base for individual services
COPY . .

# Expose ports
EXPOSE 8080 6001 6002 6003 6004 6005 6006 6007 6008 6009 3000 3001 3002

# Default command
CMD ["npm", "run", "dev"]