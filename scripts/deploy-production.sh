#!/bin/bash

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_DELAY=5
COMPOSE_FILE="docker-compose.production.yml"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check required environment variables
check_requirements() {
    local required_vars=("DOCKER_USERNAME" "CHANGED_BACKEND" "CHANGED_FRONTEND")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check if docker-compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker compose file $COMPOSE_FILE not found"
        exit 1
    fi
}

# Pull Docker images with retry logic
pull_image() {
    local image="$1"
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        log "Pulling $image (attempt $((retry+1))/$max_retries)..."
        if docker pull "$image"; then
            return 0
        fi
        retry=$((retry+1))
        if [ $retry -lt $max_retries ]; then
            warning "Failed to pull $image, retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    error "Failed to pull $image after $max_retries attempts"
    return 1
}

# Pull images for changed services
pull_changed_images() {
    local pull_failed=false
    
    if [ "$CHANGED_BACKEND" != "[]" ] && [ "$CHANGED_BACKEND" != "" ]; then
        log "Pulling backend service images..."
        while IFS= read -r service; do
            if ! pull_image "$DOCKER_USERNAME/$service:latest"; then
                pull_failed=true
            fi
        done < <(echo "$CHANGED_BACKEND" | jq -r '.[]')
    fi
    
    if [ "$CHANGED_FRONTEND" != "[]" ] && [ "$CHANGED_FRONTEND" != "" ]; then
        log "Pulling frontend service images..."
        while IFS= read -r service; do
            if ! pull_image "$DOCKER_USERNAME/$service:latest"; then
                pull_failed=true
            fi
        done < <(echo "$CHANGED_FRONTEND" | jq -r '.[]')
    fi
    
    if [ "$pull_failed" = true ]; then
        error "Failed to pull one or more images"
        exit 1
    fi
}

# Get list of services to restart
get_services_to_restart() {
    local services=()
    
    if [ "$CHANGED_BACKEND" != "[]" ] && [ "$CHANGED_BACKEND" != "" ]; then
        while IFS= read -r service; do
            services+=("$service")
        done < <(echo "$CHANGED_BACKEND" | jq -r '.[]')
    fi
    
    if [ "$CHANGED_FRONTEND" != "[]" ] && [ "$CHANGED_FRONTEND" != "" ]; then
        while IFS= read -r service; do
            services+=("$service")
        done < <(echo "$CHANGED_FRONTEND" | jq -r '.[]')
    fi
    
    echo "${services[@]}"
}

# Deploy services
deploy_services() {
    local services_to_restart=$(get_services_to_restart)
    
    if [ -z "$services_to_restart" ]; then
        log "No services to update. Ensuring all services are running..."
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        log "Deploying updated services: $services_to_restart"
        # Stop and recreate only the changed services
        docker-compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate $services_to_restart
    fi
    
    # Check if docker-compose command was successful
    if [ $? -ne 0 ]; then
        error "Docker compose deployment failed"
        exit 1
    fi
}

# Health check with retries
health_check() {
    local endpoint="${1:-http://localhost/api/health}"
    local retry=0
    
    log "Starting health checks on $endpoint..."
    
    while [ $retry -lt $HEALTH_CHECK_RETRIES ]; do
        if curl -f -s "$endpoint" > /dev/null 2>&1; then
            log "✅ Health check passed!"
            return 0
        fi
        
        retry=$((retry+1))
        if [ $retry -lt $HEALTH_CHECK_RETRIES ]; then
            warning "Health check failed (attempt $retry/$HEALTH_CHECK_RETRIES), retrying in $HEALTH_CHECK_DELAY seconds..."
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    error "❌ Health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    # Remove unused images to save disk space
    docker image prune -f
}

# Rollback function
rollback() {
    error "Deployment failed, attempting rollback..."
    # You can implement rollback logic here
    # For example, revert to previous image tags
    # docker-compose -f "$COMPOSE_FILE" down
    # docker-compose -f "$COMPOSE_FILE" up -d
}

# Main deployment process
main() {
    log "🚀 Starting production deployment..."
    
    # Check requirements
    check_requirements
    
    # Store current running services for potential rollback
    log "Saving current state..."
    docker-compose -f "$COMPOSE_FILE" ps > /tmp/deployment_state_$(date +%s).txt
    
    # Pull new images
    pull_changed_images
    
    # Deploy services
    if ! deploy_services; then
        rollback
        exit 1
    fi
    
    # Perform health checks
    if ! health_check; then
        rollback
        exit 1
    fi
    
    # Verify all expected services are running
    log "Verifying service status..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Cleanup old images
    cleanup
    
    log "🎉 Production deployment completed successfully!"
}

# Run main function
main "$@"