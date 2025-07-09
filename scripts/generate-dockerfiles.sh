#!/bin/bash

# Backend services with their ports
backend_services=(
  "auth-service:6001"
  "product-service:6002"
  "order-service:6003"
  "seller-service:6004"
  "admin-service:6005"
  "chatting-service:6006"
  "kafka-service:6007"
  "logger-service:6008"
  "recommendation-service:6009"
)

# UI services with their ports
ui_services=(
  "user-ui:3000"
  "seller-ui:3001"
  "admin-ui:3002"
)

echo "🏗️ Generating Dockerfiles for all services..."

# Generate backend service Dockerfiles
for service_port in "${backend_services[@]}"; do
  IFS=':' read -r service port <<< "$service_port"
  
  cat > "apps/$service/Dockerfile" << EOF
FROM base AS builder
WORKDIR /app
COPY apps/$service ./apps/$service
RUN npx nx build $service

FROM node:23.10.0-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE $port
CMD ["node", "dist/apps/$service/main.js"]
EOF

  echo "✅ Generated apps/$service/Dockerfile"
done

# Generate UI service Dockerfiles
for service_port in "${ui_services[@]}"; do
  IFS=':' read -r service port <<< "$service_port"
  
  cat > "apps/$service/Dockerfile" << EOF
FROM base AS builder
WORKDIR /app
COPY apps/$service ./apps/$service
RUN npx nx build $service

FROM node:23.10.0-alpine AS production
WORKDIR /app
RUN npm install next@15.1.4 react@19.0.0 react-dom@19.0.0 --only=production
COPY --from=builder /app/dist/apps/$service ./
COPY --from=base /app/packages ./packages

EXPOSE $port
CMD ["npm", "start"]
EOF

  echo "✅ Generated apps/$service/Dockerfile"
done

echo "🎉 All Dockerfiles generated successfully!"
echo "📦 Expected image sizes:"
echo "   Backend services: ~60-80MB each"
echo "   UI services: ~100-120MB each"
echo "   Total: ~1GB (vs current 10.8GB)"