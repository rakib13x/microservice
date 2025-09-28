#!/bin/bash

# Your Docker Hub username
DOCKER_USERNAME="rakib13xx"
VERSION="latest"

# List of all your services
services=(
    "auth-service"
    "product-service" 
    "order-service"
    "admin-service"
    "chatting-service"
    "recommendation-service"
    "seller-service"
    "logger-service"
    "kafka-service"
    "api-gateway"
    "admin-ui"
    "user-ui"
    "seller-ui"
)

echo "Building and pushing all services..."

for service in "${services[@]}"; do
    echo "📦 Building $service..."
    docker build -f apps/$service/Dockerfile -t $service .
    
    echo "🏷️ Tagging $service..."
    docker tag $service $DOCKER_USERNAME/$service:$VERSION
    
    echo "🚀 Pushing $service..."
    docker push $DOCKER_USERNAME/$service:$VERSION
    
    echo "✅ $service pushed successfully!"
    echo "---"
done

echo "🎉 All services pushed to Docker Hub!"
