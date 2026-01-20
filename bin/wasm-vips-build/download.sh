#!/bin/bash
#
# Download pre-built GPLv2-compatible wasm-vips from GitHub releases
# Falls back to Docker build if download fails
#
# Usage:
#   ./bin/wasm-vips-build/download.sh [--force]
#
# Options:
#   --force    Force re-download even if files exist

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/packages/vips/vendor"
WASM_VIPS_VERSION="0.0.16"

# GitHub release settings
GITHUB_REPO="WordPress/gutenberg"
RELEASE_TAG="wasm-vips-gpl-v${WASM_VIPS_VERSION}"
GITHUB_RELEASE_URL="https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}"

# Check for --force flag
FORCE_DOWNLOAD=false
if [[ "$1" == "--force" ]]; then
    FORCE_DOWNLOAD=true
fi

# Required output files
REQUIRED_FILES=(
    "vips.js"
    "vips-es6.js"
    "vips-node.js"
    "vips-node.mjs"
    "vips.wasm"
)

# Optional files (don't fail if missing)
OPTIONAL_FILES=(
    "vips-heif.wasm"
    "vips-jxl.wasm"
)

# Check if download is needed
check_download_needed() {
    if [[ "$FORCE_DOWNLOAD" == "true" ]]; then
        return 0
    fi

    for file in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$OUTPUT_DIR/$file" ]]; then
            return 0
        fi
    done

    echo "wasm-vips GPLv2 build already exists in $OUTPUT_DIR"
    echo "Use --force to re-download"
    return 1
}

# Download a file from GitHub release
download_file() {
    local filename="$1"
    local url="${GITHUB_RELEASE_URL}/${filename}"
    local output_path="${OUTPUT_DIR}/${filename}"

    echo "  Downloading ${filename}..."

    if curl -fsSL --retry 3 --retry-delay 2 -o "$output_path" "$url"; then
        return 0
    else
        return 1
    fi
}

# Download all files from GitHub release
download_from_github() {
    echo "Downloading wasm-vips v${WASM_VIPS_VERSION} from GitHub release..."
    echo "Release URL: ${GITHUB_RELEASE_URL}"
    echo ""

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Download required files
    local download_failed=false
    for file in "${REQUIRED_FILES[@]}"; do
        if ! download_file "$file"; then
            echo "  Failed to download ${file}"
            download_failed=true
            break
        fi
    done

    if [[ "$download_failed" == "true" ]]; then
        return 1
    fi

    # Download optional files (ignore failures)
    for file in "${OPTIONAL_FILES[@]}"; do
        download_file "$file" || echo "  Optional file ${file} not available (this is OK)"
    done

    return 0
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

# Fallback to Docker build
fallback_to_docker() {
    echo ""
    echo "Download failed. Falling back to Docker build..."
    echo "This may take 30-60 minutes on first build."
    echo ""

    if [[ -f "$SCRIPT_DIR/build-docker.sh" ]]; then
        bash "$SCRIPT_DIR/build-docker.sh" --force
    else
        echo "Error: Docker build script not found at $SCRIPT_DIR/build-docker.sh"
        exit 1
    fi
}

# Main
main() {
    echo "=== wasm-vips GPLv2 Download ==="
    echo "Version: $WASM_VIPS_VERSION"
    echo ""

    if ! check_download_needed; then
        exit 0
    fi

    if download_from_github; then
        create_vendor_package_json

        echo ""
        echo "=== Download Complete ==="
        echo "GPLv2-compatible wasm-vips files are now in:"
        echo "  $OUTPUT_DIR"
        echo ""
        echo "The @wordpress/vips package will use these files instead of the npm package."
    else
        fallback_to_docker
    fi
}

main "$@"
