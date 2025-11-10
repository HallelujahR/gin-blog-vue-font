#!/bin/sh
set -e

# Resolve project root based on this script's location (scripts/..)
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)"
IMAGE_NAME="blog-frontend"
CONTAINER_NAME="blog-frontend"
# Use locally cached base images from your registry
NODE_IMAGE_DEFAULT="docker.1ms.run/library/node:latest"
NGINX_IMAGE_DEFAULT="docker.1ms.run/library/nginx:latest"

NODE_IMAGE="${NODE_IMAGE:-$NODE_IMAGE_DEFAULT}"
NGINX_IMAGE="${NGINX_IMAGE:-$NGINX_IMAGE_DEFAULT}"

# -------- helpers --------
print_kv() {
  printf "  - %s: %s\n" "$1" "$2"
}

step() {
  printf "\n==> %s\n" "$1"
}

case "$1" in
  build)
    step "Build frontend image"
    print_kv "Project root" "$ROOT"
    print_kv "Image name" "$IMAGE_NAME"
    print_kv "Node base" "$NODE_IMAGE"
    print_kv "Nginx base" "$NGINX_IMAGE"
    docker build --pull=false \
      --build-arg NODE_IMAGE="$NODE_IMAGE" \
      --build-arg NGINX_IMAGE="$NGINX_IMAGE" \
      -t "$IMAGE_NAME" "$ROOT"
    printf "✔ Build completed: %s\n" "$IMAGE_NAME"
    ;;
  run)
    step "Run frontend container"
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    HOST_PORT="${FRONTEND_PORT:-80}"
    print_kv "Container name" "$CONTAINER_NAME"
    print_kv "Image name" "$IMAGE_NAME"
    print_kv "Host port" "$HOST_PORT"
    print_kv "Container port" "80"
    docker run -d --name "$CONTAINER_NAME" -p "$HOST_PORT:80" "$IMAGE_NAME"
    printf "✔ Container started: http://localhost:%s\n" "$HOST_PORT"
    ;;
  stop)
    step "Stop and remove frontend container"
    print_kv "Container name" "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    printf "✔ Container removed: %s\n" "$CONTAINER_NAME"
    ;;
  *)
    echo "Usage: $0 {build|run|stop}"
    echo "ENV overrides:"
    print_kv "NODE_IMAGE" "$NODE_IMAGE_DEFAULT"
    print_kv "NGINX_IMAGE" "$NGINX_IMAGE_DEFAULT"
    print_kv "FRONTEND_PORT" "80 (host port mapped to container 80)"
    exit 1
    ;;
esac
