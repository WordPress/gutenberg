# UltraHDR WASM Library

A GPLv2-compatible Rust library implementing ISO 21496-1 (UltraHDR/gain map) specification, compiled to WebAssembly for integration with WordPress Gutenberg's client-side media processing.

## Features

- **Detection**: Check if a JPEG contains UltraHDR/gain map data
- **Decoding**: Extract SDR base, gain map, and metadata from UltraHDR JPEGs
- **Encoding**: Create UltraHDR JPEGs from SDR + HDR image pairs
- **SDR Extraction**: Extract backwards-compatible SDR image

## Standards Support

- [ISO 21496-1:2025](https://www.iso.org/standard/86775.html) - Gain map metadata for dynamic range conversion
- [Google UltraHDR v1](https://developer.android.com/media/platform/hdr-image-format) - Android compatibility
- [Adobe Gain Map Specification](https://helpx.adobe.com/camera-raw/using/gain-map.html)

## Building

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Build Commands

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Run tests
npm run test
```

## Usage

This package is intended to be used via the `@wordpress/ultrahdr` TypeScript wrapper. See that package for usage examples.

## Architecture

```
src/
├── lib.rs              # WASM entry point and exports
├── types.rs            # Shared types (GainMapMetadata, etc.)
├── error.rs            # Error handling
├── gainmap/
│   ├── mod.rs          # Gain map module
│   ├── math.rs         # Color space conversions
│   ├── metadata.rs     # ISO 21496-1 metadata structures
│   ├── encode.rs       # Gain map computation
│   └── decode.rs       # Gain map application
├── jpeg/
│   ├── mod.rs          # JPEG handling
│   ├── parser.rs       # APP1/APP2/MPF segment parsing
│   ├── writer.rs       # JPEG segment writing
│   └── xmp.rs          # XMP embedding/extraction
└── ultrahdr/
    ├── mod.rs          # UltraHDR format
    ├── encoder.rs      # Create UltraHDR JPEG
    └── decoder.rs      # Extract components
```

## License

GPL-2.0-or-later

## Dependencies

All dependencies are GPLv2-compatible (via MIT license):

| Dependency | License | Purpose |
|------------|---------|---------|
| wasm-bindgen | MIT/Apache-2.0 | WASM bindings |
| image | MIT/Apache-2.0 | Image processing |
| zune-jpeg | MIT/Apache-2.0/Zlib | JPEG decoding |
| quick-xml | MIT | XMP parsing |
| serde | MIT/Apache-2.0 | Serialization |
| thiserror | MIT/Apache-2.0 | Error handling |
