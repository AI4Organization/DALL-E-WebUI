#!/bin/bash

# ==============================================================================
# DALL-E Web UI Docker Service Script
# ==============================================================================
# This script reads environment variables from .env file and starts the
# application using Docker.
#
# Usage: ./start-docker-service.sh [options]
#   --build       Force rebuild the Docker image
#   --no-cache    Build without using cache
#   --detach      Run container in detached mode (default)
#   --interactive Run container in interactive mode
#   --stop        Stop and remove the container
#   --clean       Stop, remove container and image
#   -h, --help    Show this help message
#
# Environment variables (from .env):
#   OPENAI_API_KEY    Required: API key for OpenAI or compatible service
#   OPENAI_BASE_URL   Required: Base URL for the API
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="dalle-webui"
CONTAINER_NAME="dalle-webui-container"
PORT=3000
ENV_FILE=".env"

# Default options
FORCE_BUILD=false
NO_CACHE=false
DETACH=true
STOP_ONLY=false
CLEAN_ALL=false

# ==============================================================================
# Helper Functions
# ==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "  DALL-E Web UI Docker Service"
    echo "=========================================="
    echo ""
}

show_help() {
    cat << EOF
Usage: ./start-docker-service.sh [options]

Options:
  --build       Force rebuild the Docker image
  --no-cache    Build without using cache
  --detach      Run container in detached mode (default)
  --interactive Run container in interactive mode
  --stop        Stop and remove the container
  --clean       Stop, remove container and image
  -h, --help    Show this help message

Environment variables (from .env):
  OPENAI_API_KEY    Required: API key for OpenAI or compatible service
  OPENAI_BASE_URL   Required: Base URL for the API

Examples:
  ./start-docker-service.sh              # Start service (builds if needed)
  ./start-docker-service.sh --build      # Force rebuild image
  ./start-docker-service.sh --no-cache   # Build without cache
  ./start-docker-service.sh --stop       # Stop the service
  ./start-docker-service.sh --clean      # Clean up everything

EOF
}

# ==============================================================================
# Validation Functions
# ==============================================================================

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file '$ENV_FILE' not found!"
        log_info "Please create a .env file based on .env.example"
        return 1
    fi
    log_success "Environment file found: $ENV_FILE"
    return 0
}

check_env_variables() {
    local missing_vars=()

    # Source the .env file to check variables
    source "$ENV_FILE"

    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "Place with your API key here" ]; then
        missing_vars+=("OPENAI_API_KEY")
    fi

    if [ -z "$OPENAI_BASE_URL" ]; then
        missing_vars+=("OPENAI_BASE_URL")
    fi

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set these variables in $ENV_FILE"
        return 1
    fi

    log_success "Environment variables validated"
    return 0
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        return 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        return 1
    fi

    log_success "Docker is available"
    return 0
}

# ==============================================================================
# Docker Functions
# ==============================================================================

check_image_exists() {
    docker image inspect "$IMAGE_NAME:latest" &> /dev/null
    return $?
}

check_container_running() {
    docker ps -q -f name="$CONTAINER_NAME" | grep -q . && return 0
    return 1
}

stop_container() {
    if check_container_running; then
        log_info "Stopping container: $CONTAINER_NAME"
        docker stop "$CONTAINER_NAME"
        log_success "Container stopped"
    else
        log_info "Container is not running"
    fi

    if docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
        log_info "Removing container: $CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        log_success "Container removed"
    fi
}

remove_image() {
    if check_image_exists; then
        log_info "Removing image: $IMAGE_NAME"
        docker rmi "$IMAGE_NAME:latest"
        log_success "Image removed"
    else
        log_info "Image does not exist"
    fi
}

build_image() {
    local build_args=""

    if [ "$NO_CACHE" = true ]; then
        build_args="$build_args --no-cache"
    fi

    log_info "Building Docker image: $IMAGE_NAME"
    docker build $build_args -t "$IMAGE_NAME:latest" .

    if [ $? -eq 0 ]; then
        log_success "Docker image built successfully"
    else
        log_error "Docker image build failed"
        exit 1
    fi
}

start_container() {
    local run_args=""

    if [ "$DETACH" = true ]; then
        run_args="$run_args -d"
    fi

    # Read environment variables from .env and convert to Docker --env format
    local env_vars=""
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^['\''"]*//;s/['\''"]*$//')
        env_vars="$env_vars --env $key=$value"
    done < "$ENV_FILE"

    log_info "Starting container: $CONTAINER_NAME"
    log_info "Port: $PORT -> 3000"

    # Run the container
    docker run $run_args \
        --name "$CONTAINER_NAME" \
        -p "$PORT:3000" \
        --restart unless-stopped \
        $env_vars \
        "$IMAGE_NAME:latest"

    if [ $? -eq 0 ]; then
        if [ "$DETACH" = true ]; then
            log_success "Container started in detached mode"
            log_info "Access the application at: http://localhost:$PORT"
            log_info "View logs with: docker logs -f $CONTAINER_NAME"
        else
            log_success "Container started in interactive mode"
        fi
    else
        log_error "Failed to start container"
        exit 1
    fi
}

# ==============================================================================
# Main Function
# ==============================================================================

main() {
    print_header

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                FORCE_BUILD=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --detach)
                DETACH=true
                shift
                ;;
            --interactive)
                DETACH=false
                shift
                ;;
            --stop)
                STOP_ONLY=true
                shift
                ;;
            --clean)
                CLEAN_ALL=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Handle stop option
    if [ "$STOP_ONLY" = true ]; then
        check_docker || exit 1
        stop_container
        log_success "Service stopped successfully"
        exit 0
    fi

    # Handle clean option
    if [ "$CLEAN_ALL" = true ]; then
        check_docker || exit 1
        stop_container
        remove_image
        log_success "Cleanup completed successfully"
        exit 0
    fi

    # Validate prerequisites
    check_docker || exit 1
    check_env_file || exit 1
    check_env_variables || exit 1

    # Stop existing container if running
    if check_container_running; then
        log_warning "Container is already running. Stopping it first..."
        stop_container
    fi

    # Build image if needed or forced
    if [ "$FORCE_BUILD" = true ]; then
        build_image
    elif ! check_image_exists; then
        log_info "Docker image not found. Building..."
        build_image
    else
        log_info "Docker image exists. Use --build to force rebuild."
    fi

    # Start container
    start_container

    echo ""
    log_success "DALL-E Web UI is now running!"
    echo "=========================================="
    echo ""
}

# Run main function
main "$@"
