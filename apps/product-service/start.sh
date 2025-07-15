#!/bin/sh

# Generate Prisma client at runtime with environment variables
pnpm exec prisma generate --schema=prisma/schema.prisma

# Wait a moment for environment variables to be fully loaded
sleep 3

# Build the application with the new Prisma client using root node_modules
cd apps/product-service && ../../node_modules/.bin/tsc && cd ../..

# Start the application with the newly built code
exec node apps/product-service/dist/main.js 