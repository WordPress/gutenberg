#!/bin/bash
#
# Build wasm-vips with GPLv2-compatible options (--disable-uhdr)
# This script uses Docker to ensure a consistent build environment.
#
# Usage:
#   ./bin/wasm-vips-build/build.sh [--force]
#
# Options:
#   --force    Force rebuild even if output files exist

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/packages/vips/vendor"
DOCKER_IMAGE="gutenberg-wasm-vips-builder"
WASM_VIPS_VERSION="0.0.16"

# Check for --force flag
FORCE_BUILD=false
if [[ "$1" == "--force" ]]; then
    FORCE_BUILD=true
fi

# Required output files
REQUIRED_FILES=(
    "vips.js"
    "vips-es6.js"
    "vips-node.js"
    "vips-node.mjs"
    "vips.wasm"
)

# Check if build is needed
check_build_needed() {
    if [[ "$FORCE_BUILD" == "true" ]]; then
        return 0
    fi

    for file in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$OUTPUT_DIR/$file" ]]; then
            return 0
        fi
    done

    echo "wasm-vips GPLv2 build already exists in $OUTPUT_DIR"
    echo "Use --force to rebuild"
    return 1
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        echo "Please install Docker to build wasm-vips"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo "Error: Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
}

# Build the Docker image
build_docker_image() {
    echo "Building Docker image for wasm-vips..."

    # Try buildx with cache first (for CI with proper driver setup)
    # Fall back to regular docker build if cache export isn't supported
    if docker buildx version &> /dev/null && [[ -n "${BUILDX_CACHE_DIR:-}" ]]; then
        CACHE_DIR="$BUILDX_CACHE_DIR"
        echo "Using Docker Buildx with cache at $CACHE_DIR"

        docker buildx build \
            --build-arg WASM_VIPS_VERSION="$WASM_VIPS_VERSION" \
            --cache-from type=local,src="$CACHE_DIR" \
            --cache-to type=local,dest="$CACHE_DIR",mode=max \
            --load \
            -t "$DOCKER_IMAGE" \
            "$SCRIPT_DIR"
    else
        echo "Using standard Docker build"
        docker build \
            --build-arg WASM_VIPS_VERSION="$WASM_VIPS_VERSION" \
            -t "$DOCKER_IMAGE" \
            "$SCRIPT_DIR"
    fi
}

# Extract built files from Docker image
extract_files() {
    echo "Extracting built files..."

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Create a temporary container and copy files
    CONTAINER_ID=$(docker create "$DOCKER_IMAGE")
    docker cp "$CONTAINER_ID:/output/." "$OUTPUT_DIR/"
    docker rm "$CONTAINER_ID"

    echo "Files extracted to $OUTPUT_DIR"
}

# Create package.json for the vendor directory
create_vendor_package_json() {
    cat > "$OUTPUT_DIR/package.json" << EOF
{
  "name": "@wordpress/wasm-vips-vendor",
  "version": "$WASM_VIPS_VERSION",
  "private": true,
  "description": "GPLv2-compatible wasm-vips build (without UltraHDR)",
  "license": "MIT",
  "main": "vips-node.js",
  "module": "vips-es6.js",
  "exports": {
    ".": {
      "node": {
        "import": "./vips-node.mjs",
        "require": "./vips-node.js"
      },
      "default": {
        "import": "./vips-es6.js",
        "require": "./vips.js"
      }
    },
    "./vips.wasm": "./vips.wasm",
    "./vips-heif.wasm": "./vips-heif.wasm",
    "./vips-jxl.wasm": "./vips-jxl.wasm"
  }
}
EOF
    echo "Created $OUTPUT_DIR/package.json"
}

# Main
main() {
    echo "=== wasm-vips GPLv2 Build ==="
    echo "Version: $WASM_VIPS_VERSION"
    echo ""

    if ! check_build_needed; then
        exit 0
    fi

    check_docker

    echo "Building wasm-vips with --disable-uhdr for GPLv2 compatibility..."
    echo "This may take 30-60 minutes on first build."
    echo ""

    build_docker_image
    extract_files
    create_vendor_package_json

    echo ""
    echo "=== Build Complete ==="
    echo "GPLv2-compatible wasm-vips files are now in:"
    echo "  $OUTPUT_DIR"
    echo ""
    echo "The @wordpress/vips package will use these files instead of the npm package."
}

main "$@"
