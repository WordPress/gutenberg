/**
 * WordPress UltraHDR Library
 *
 * TypeScript bindings for the UltraHDR WASM library.
 * Provides detection, encoding, and decoding of UltraHDR JPEG images
 * implementing ISO 21496-1 (gain map) specification.
 *
 * @example
 * ```typescript
 * import { isUltraHdr, decodeUltraHdr, setLocation } from '@wordpress/ultrahdr';
 *
 * // Set the location for WASM files
 * setLocation('/path/to/wasm/');
 *
 * // Check if an image is UltraHDR
 * const buffer = await file.arrayBuffer();
 * if (await isUltraHdr(buffer)) {
 *     const result = await decodeUltraHdr('item-1', buffer);
 *     console.log('HDR headroom:', result.metadata.hdrCapacityMax);
 * }
 * ```
 */

// Re-export types
export type {
	ItemId,
	GainMapMetadata,
	UltraHdrDecodeResult,
	UltraHdrEncodeOptions,
} from './types';

export {
	ColorGamut,
	TransferFunction,
	defaultEncodeOptions,
	highQualityEncodeOptions,
	smallSizeEncodeOptions,
} from './types';

import type {
	ItemId,
	GainMapMetadata,
	UltraHdrDecodeResult,
	UltraHdrEncodeOptions,
} from './types';

import { defaultEncodeOptions } from './types';

// WASM module type (these come from the generated WASM bindings)
interface UltraHdrWasmModule {
	default: ( moduleOrPath?: string | URL | Response ) => Promise< unknown >;
	isUltraHdr: ( buffer: Uint8Array ) => boolean;
	decodeUltraHdr: ( buffer: Uint8Array ) => UltraHdrDecodeResult;
	encodeUltraHdr: (
		sdrBuffer: Uint8Array,
		hdrBuffer: Float32Array,
		options: UltraHdrEncodeOptions
	) => Uint8Array;
	extractSdrBase: ( buffer: Uint8Array ) => Uint8Array;
	getMetadata: ( buffer: Uint8Array ) => GainMapMetadata;
	createDefaultOptions: () => UltraHdrEncodeOptions;
	createHighQualityOptions: () => UltraHdrEncodeOptions;
	createSmallSizeOptions: () => UltraHdrEncodeOptions;
	createDefaultMetadata: () => GainMapMetadata;
	validateMetadata: ( metadata: GainMapMetadata ) => boolean;
	estimateHdrHeadroom: ( metadata: GainMapMetadata ) => number;
	isMeaningfulHdr: ( metadata: GainMapMetadata ) => boolean;
}

/**
 * Location prefix for WASM files.
 * Set this before calling any other functions.
 */
let location = '';

/**
 * Cached WASM module instance.
 */
let wasmInstance: UltraHdrWasmModule | null = null;

/**
 * Promise for ongoing WASM initialization.
 */
let initPromise: Promise< UltraHdrWasmModule > | null = null;

/**
 * Sets the location/public path for loading WASM files.
 *
 * This must be called before using any other functions when the WASM
 * files are not in the same directory as the JavaScript bundle.
 *
 * @param newLocation - Base URL or path where WASM files are located.
 *
 * @example
 * ```typescript
 * // Set location before any other calls
 * setLocation('/wp-content/plugins/gutenberg/build/');
 * ```
 */
export function setLocation( newLocation: string ): void {
	location = newLocation;
}

/**
 * Gets the WASM module, initializing it if necessary.
 */
async function getWasm(): Promise< UltraHdrWasmModule > {
	if ( wasmInstance ) {
		return wasmInstance;
	}

	if ( initPromise ) {
		return initPromise;
	}

	initPromise = ( async () => {
		// Dynamic import of the WASM package
		const UltraHdrWasm = ( await import(
			'@wordpress/ultrahdr-wasm'
		) ) as unknown as UltraHdrWasmModule;

		// Initialize WASM with the location prefix for the .wasm file
		// If location is set, construct the full URL to the WASM file
		if ( location ) {
			const wasmUrl = location + 'wordpress_ultrahdr_bg.wasm';
			await UltraHdrWasm.default( wasmUrl );
		} else {
			// Let the WASM module use its default URL resolution (import.meta.url)
			await UltraHdrWasm.default();
		}

		wasmInstance = UltraHdrWasm as unknown as UltraHdrWasmModule;
		return wasmInstance;
	} )();

	return initPromise;
}

/**
 * Checks if a buffer contains an UltraHDR image.
 *
 * This is a fast check that looks for gain map metadata without
 * fully decoding the image.
 *
 * @param buffer - JPEG file contents.
 * @return True if the image contains UltraHDR/gain map data.
 *
 * @example
 * ```typescript
 * const buffer = await file.arrayBuffer();
 * if (await isUltraHdr(buffer)) {
 *     console.log('This is an UltraHDR image!');
 * }
 * ```
 */
export async function isUltraHdr( buffer: ArrayBuffer ): Promise< boolean > {
	const wasm = await getWasm();
	return wasm.isUltraHdr( new Uint8Array( buffer ) );
}

/**
 * Decodes an UltraHDR image, extracting all components.
 *
 * @param id     - Unique identifier for this operation (for cancellation).
 * @param buffer - UltraHDR JPEG file contents.
 * @return Decoded result with SDR image, gain map, and metadata.
 *
 * @throws Error if the buffer is not a valid UltraHDR JPEG.
 *
 * @example
 * ```typescript
 * const buffer = await file.arrayBuffer();
 * const result = await decodeUltraHdr('upload-1', buffer);
 *
 * // Access components
 * const sdrBlob = new Blob([result.sdrImage], { type: 'image/jpeg' });
 * console.log('Image size:', result.width, 'x', result.height);
 * console.log('HDR capacity:', result.metadata.hdrCapacityMax);
 * ```
 */
export async function decodeUltraHdr(
	id: ItemId,
	buffer: ArrayBuffer
): Promise< UltraHdrDecodeResult > {
	const wasm = await getWasm();
	return wasm.decodeUltraHdr( new Uint8Array( buffer ) );
}

/**
 * Encodes an UltraHDR JPEG from SDR and HDR inputs.
 *
 * @param id        - Unique identifier for this operation.
 * @param sdrBuffer - SDR JPEG image bytes.
 * @param hdrBuffer - HDR linear RGB data (Float32Array, 3 values per pixel).
 * @param options   - Encoding options.
 * @return Encoded UltraHDR JPEG as ArrayBuffer.
 *
 * @throws Error if inputs are invalid or dimensions don't match.
 *
 * @example
 * ```typescript
 * const sdrBuffer = await sdrFile.arrayBuffer();
 * const hdrData = await getHdrLinearData(); // Float32Array
 *
 * const ultraHdr = await encodeUltraHdr('encode-1', sdrBuffer, hdrData, {
 *     ...defaultEncodeOptions,
 *     targetHdrCapacity: 4.0,
 * });
 *
 * // Create downloadable file
 * const blob = new Blob([ultraHdr], { type: 'image/jpeg' });
 * ```
 */
export async function encodeUltraHdr(
	id: ItemId,
	sdrBuffer: ArrayBuffer,
	hdrBuffer: ArrayBuffer,
	options?: Partial< UltraHdrEncodeOptions >
): Promise< ArrayBuffer > {
	const wasm = await getWasm();
	const opts = {
		...defaultEncodeOptions,
		...options,
	} as UltraHdrEncodeOptions;

	const result = wasm.encodeUltraHdr(
		new Uint8Array( sdrBuffer ),
		new Float32Array( hdrBuffer ),
		opts
	);

	// Ensure we return a proper ArrayBuffer (not SharedArrayBuffer)
	return result.buffer.slice( 0 ) as ArrayBuffer;
}

/**
 * Extracts the SDR base image from an UltraHDR JPEG.
 *
 * This produces a standard JPEG that can be displayed on any device,
 * without the gain map metadata. Useful for backwards compatibility.
 *
 * @param buffer - UltraHDR JPEG file contents.
 * @return Standard JPEG without gain map.
 *
 * @example
 * ```typescript
 * const ultraHdrBuffer = await file.arrayBuffer();
 * const sdrBuffer = await extractSdrBase(ultraHdrBuffer);
 *
 * // Use the SDR image for non-HDR displays
 * const blob = new Blob([sdrBuffer], { type: 'image/jpeg' });
 * ```
 */
export async function extractSdrBase(
	buffer: ArrayBuffer
): Promise< ArrayBuffer > {
	const wasm = await getWasm();
	const result = wasm.extractSdrBase( new Uint8Array( buffer ) );
	// Ensure we return a proper ArrayBuffer (not SharedArrayBuffer)
	return result.buffer.slice( 0 ) as ArrayBuffer;
}

/**
 * Gets gain map metadata from an UltraHDR JPEG.
 *
 * This is faster than `decodeUltraHdr` when you only need the metadata.
 *
 * @param buffer - UltraHDR JPEG file contents.
 * @return Gain map metadata.
 *
 * @throws Error if the buffer doesn't contain gain map metadata.
 *
 * @example
 * ```typescript
 * const metadata = await getMetadata(buffer);
 * console.log('Version:', metadata.version);
 * console.log('HDR headroom:', metadata.hdrCapacityMax, 'stops');
 * ```
 */
export async function getMetadata(
	buffer: ArrayBuffer
): Promise< GainMapMetadata > {
	const wasm = await getWasm();
	return wasm.getMetadata( new Uint8Array( buffer ) );
}

/**
 * Validates gain map metadata.
 *
 * @param metadata - The metadata to validate.
 * @return True if the metadata is valid.
 */
export async function validateMetadata(
	metadata: GainMapMetadata
): Promise< boolean > {
	const wasm = await getWasm();
	return wasm.validateMetadata( metadata );
}

/**
 * Estimates the HDR headroom from metadata.
 *
 * @param metadata - The gain map metadata.
 * @return Maximum additional stops of dynamic range above SDR.
 */
export async function estimateHdrHeadroom(
	metadata: GainMapMetadata
): Promise< number > {
	const wasm = await getWasm();
	return wasm.estimateHdrHeadroom( metadata );
}

/**
 * Checks if metadata indicates a meaningful HDR image.
 *
 * @param metadata - The gain map metadata.
 * @return True if the gain map provides significant dynamic range extension.
 */
export async function isMeaningfulHdr(
	metadata: GainMapMetadata
): Promise< boolean > {
	const wasm = await getWasm();
	return wasm.isMeaningfulHdr( metadata );
}
