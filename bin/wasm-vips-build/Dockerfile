# Dockerfile for building wasm-vips with GPLv2-compatible options (no UltraHDR)
# Based on emscripten/emsdk with additional build dependencies

FROM emscripten/emsdk:3.1.61

# Install additional build dependencies
RUN apt-get update && apt-get install -y \
    ninja-build \
    pkg-config \
    curl \
    git \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install newer Meson via pip (apt version is too old for glib)
RUN pip3 install meson>=1.4.0

# Install Rust (needed for resvg)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add wasm32-unknown-emscripten

# Set working directory
WORKDIR /build

# Clone wasm-vips at the specific version
ARG WASM_VIPS_VERSION=0.0.16
RUN git clone --depth 1 --branch v${WASM_VIPS_VERSION} https://github.com/kleisauke/wasm-vips.git .

# Build wasm-vips
# Note: v0.0.16 predates UltraHDR support, so no --disable-uhdr flag needed
# For future versions that include UltraHDR, add --disable-uhdr flag
RUN ./build.sh

# Output directory for built files
RUN mkdir -p /output && \
    cp lib/vips.js lib/vips-es6.js lib/vips-node.js lib/vips-node.mjs lib/vips.wasm /output/ && \
    cp lib/vips-heif.wasm lib/vips-jxl.wasm /output/ 2>/dev/null || true && \
    cp versions.json /output/ 2>/dev/null || true

# Default command outputs the location of built files
CMD ["echo", "Built files are in /output"]
