#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Pull latest images for changed services
if [ "$CHANGED_BACKEND" != "[]" ]; then
    echo "Pulling backend service images..."
    for service in $(echo $CHANGED_BACKEND | jq -r '.[]'); do
        echo "Pulling $DOCKER_USERNAME/$service:latest"
        docker pull $DOCKER_USERNAME/$service:latest
    done
fi

if [ "$CHANGED_FRONTEND" != "[]" ]; then
    echo "Pulling frontend service images..."
    for service in $(echo $CHANGED_FRONTEND | jq -r '.[]'); do
        echo "Pulling $DOCKER_USERNAME/$service:latest"
        docker pull $DOCKER_USERNAME/$service:latest
    done
fi

# Start/restart services using docker-compose
echo "Deploying services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Verify deployment
echo "Verifying deployment..."
if curl -f http://localhost:8080/gateway-health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment verification failed!"
    exit 1
fi