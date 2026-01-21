# UltraHDR

TypeScript bindings for UltraHDR (ISO 21496-1) gain map support in WordPress Gutenberg.

## Installation

```bash
npm install @wordpress/ultrahdr
```

## Usage

```typescript
import {
    setLocation,
    isUltraHdr,
    decodeUltraHdr,
    extractSdrBase,
    encodeUltraHdr,
    defaultEncodeOptions
} from '@wordpress/ultrahdr';

// Set the location for WASM files (required before other calls)
setLocation('/path/to/wasm/');

// Check if an image is UltraHDR
const buffer = await file.arrayBuffer();
if (await isUltraHdr(buffer)) {
    console.log('This is an UltraHDR image!');

    // Decode to get components
    const result = await decodeUltraHdr('item-1', buffer);
    console.log('Image size:', result.width, 'x', result.height);
    console.log('HDR headroom:', result.metadata.hdrCapacityMax, 'stops');

    // Extract just the SDR base for backwards compatibility
    const sdrBuffer = await extractSdrBase(buffer);
    const sdrBlob = new Blob([sdrBuffer], { type: 'image/jpeg' });
}

// Create UltraHDR from SDR + HDR inputs
const sdrBuffer = await sdrFile.arrayBuffer();
const hdrLinearData = await getHdrLinearData(); // Float32Array

const ultraHdr = await encodeUltraHdr('encode-1', sdrBuffer, hdrLinearData, {
    ...defaultEncodeOptions,
    targetHdrCapacity: 4.0,
});
```

## API Reference

### `setLocation(path: string): void`

Sets the location/public path for loading WASM files. Must be called before using any other functions.

### `isUltraHdr(buffer: ArrayBuffer): Promise<boolean>`

Checks if a buffer contains an UltraHDR image. Fast check that looks for gain map metadata without fully decoding.

### `decodeUltraHdr(id: ItemId, buffer: ArrayBuffer): Promise<UltraHdrDecodeResult>`

Decodes an UltraHDR image, extracting all components:
- `sdrImage`: The SDR base image as JPEG bytes
- `gainMap`: The gain map as JPEG bytes
- `metadata`: Gain map metadata
- `width`, `height`: Image dimensions
- `gainMapWidth`, `gainMapHeight`: Gain map dimensions

### `encodeUltraHdr(id: ItemId, sdrBuffer: ArrayBuffer, hdrBuffer: ArrayBuffer, options?: Partial<UltraHdrEncodeOptions>): Promise<ArrayBuffer>`

Encodes an UltraHDR JPEG from SDR and HDR inputs.

### `extractSdrBase(buffer: ArrayBuffer): Promise<ArrayBuffer>`

Extracts the SDR base image from an UltraHDR JPEG. Returns a standard JPEG that can be displayed on any device.

### `getMetadata(buffer: ArrayBuffer): Promise<GainMapMetadata>`

Gets gain map metadata from an UltraHDR JPEG without full decode.

### `validateMetadata(metadata: GainMapMetadata): Promise<boolean>`

Validates gain map metadata.

### `estimateHdrHeadroom(metadata: GainMapMetadata): Promise<number>`

Estimates the HDR headroom (additional stops of dynamic range) from metadata.

### `isMeaningfulHdr(metadata: GainMapMetadata): Promise<boolean>`

Checks if metadata indicates a meaningful HDR image (>0.5 stops headroom).

## Types

### `GainMapMetadata`

```typescript
interface GainMapMetadata {
    version: string;
    baseRenditionIsHdr: boolean;
    gainMapMin: number[];
    gainMapMax: number[];
    gamma: number[];
    offsetSdr: number[];
    offsetHdr: number[];
    hdrCapacityMin: number;
    hdrCapacityMax: number;
}
```

### `UltraHdrEncodeOptions`

```typescript
interface UltraHdrEncodeOptions {
    baseQuality: number;        // 1-100
    gainMapQuality: number;     // 1-100
    targetHdrCapacity: number;  // typically 2.0-4.0
    includeIsoMetadata: boolean;
    includeUltrahdrV1: boolean;
    gainMapScale: number;       // 1, 2, or 4
}
```

## Predefined Options

- `defaultEncodeOptions` - Balanced quality/size
- `highQualityEncodeOptions` - Maximum quality
- `smallSizeEncodeOptions` - Smaller file size

## Standards

This package implements:
- [ISO 21496-1:2025](https://www.iso.org/standard/86775.html) - Gain map metadata
- [Google UltraHDR v1](https://developer.android.com/media/platform/hdr-image-format) - Android compatibility

## License

GPL-2.0-or-later
