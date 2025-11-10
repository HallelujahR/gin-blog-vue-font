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

case "$1" in
  build)
    docker build --pull=false \
      --build-arg NODE_IMAGE="$NODE_IMAGE" \
      --build-arg NGINX_IMAGE="$NGINX_IMAGE" \
      -t "$IMAGE_NAME" "$ROOT"
    ;;
  run)
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    HOST_PORT="${FRONTEND_PORT:-8080}"
    docker run -d --name "$CONTAINER_NAME" -p "$HOST_PORT:80" "$IMAGE_NAME"
    ;;
  stop)
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    ;;
  *)
    echo "Usage: $0 {build|run|stop}"
    echo "ENV overrides: NODE_IMAGE, NGINX_IMAGE"
    exit 1
    ;;
esac


