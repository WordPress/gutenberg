/**
 * Internal dependencies
 */
import type { ImageDimensions } from './get-image-dimensions';

interface NavigatorNetworkInformation {
	saveData: boolean;
	effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
}

interface NavigatorExtended extends Navigator {
	deviceMemory?: number;
	connection?: NavigatorNetworkInformation;
}

/**
 * Result of client-side media processing support detection.
 */
export interface FeatureDetectionResult {
	/**
	 * Whether client-side media processing is supported.
	 */
	supported: boolean;
	/**
	 * Reason why client-side media processing is not supported (if applicable).
	 */
	reason?: string;
}

/**
 * Cached result of feature detection.
 */
let cachedResult: FeatureDetectionResult | null = null;

/**
 * Detects whether the browser supports client-side media processing.
 *
 * Checks (in order of evaluation):
 * 1. WebAssembly support (required for wasm-vips).
 * 2. SharedArrayBuffer support (required for WASM threading; relies on
 *    cross-origin isolation headers being set).
 * 3. Web Worker support (baseline requirement for the processing worker).
 * 4. Device memory: disables on devices reporting ≤ 2 GB of RAM.
 * 5. Hardware concurrency: disables on devices reporting fewer than 2 CPU cores.
 * 6. Network conditions: disables when the data saver flag is on, or when the
 *    connection's effective type is `slow-2g` or `2g`.
 * 7. CSP compatibility for blob URL workers: a probe Worker is created from a
 *    blob: URL to confirm the site's Content Security Policy permits inline
 *    worker creation (`worker-src` must allow `blob:`).
 *
 * Results are cached after the first call. Use `clearFeatureDetectionCache()` to reset.
 *
 * @return Feature detection result with supported status and reason if not supported.
 */
export function detectClientSideMediaSupport(): FeatureDetectionResult {
	// Return cached result if available.
	if ( cachedResult !== null ) {
		return cachedResult;
	}

	// Check WebAssembly support.
	if ( typeof WebAssembly === 'undefined' ) {
		cachedResult = {
			supported: false,
			reason: 'WebAssembly is not supported in this browser.',
		};
		return cachedResult;
	}

	// Check SharedArrayBuffer support (required for WASM threading).
	if ( typeof SharedArrayBuffer === 'undefined' ) {
		cachedResult = {
			supported: false,
			reason: 'SharedArrayBuffer is not available. This may be due to missing cross-origin isolation headers.',
		};
		return cachedResult;
	}

	// Check Web Worker support.
	if ( typeof Worker === 'undefined' ) {
		cachedResult = {
			supported: false,
			reason: 'Web Workers are not supported in this browser.',
		};
		return cachedResult;
	}

	// Check device memory.
	if (
		typeof navigator !== 'undefined' &&
		'deviceMemory' in navigator &&
		( navigator as NavigatorExtended ).deviceMemory! <= 2
	) {
		cachedResult = {
			supported: false,
			reason: 'Device has insufficient memory for client-side media processing.',
		};
		return cachedResult;
	}

	// Check hardware concurrency (number of CPU cores).
	if (
		typeof navigator !== 'undefined' &&
		'hardwareConcurrency' in navigator &&
		navigator.hardwareConcurrency < 2
	) {
		cachedResult = {
			supported: false,
			reason: 'Device has insufficient CPU cores for client-side media processing.',
		};
		return cachedResult;
	}

	// Check network conditions.
	if ( typeof navigator !== 'undefined' ) {
		const connection = ( navigator as NavigatorExtended ).connection;
		if ( connection ) {
			if ( connection.saveData ) {
				cachedResult = {
					supported: false,
					reason: 'Data saver mode is enabled.',
				};
				return cachedResult;
			}
			if (
				connection.effectiveType === 'slow-2g' ||
				connection.effectiveType === '2g'
			) {
				cachedResult = {
					supported: false,
					reason: 'Network connection is too slow for client-side media processing.',
				};
				return cachedResult;
			}
		}
	}

	// Check that blob URL workers are allowed by CSP.
	// Security plugins often set a strict worker-src directive that blocks blob: URLs,
	// which would prevent creating the WASM processing worker at runtime.
	if ( typeof window !== 'undefined' ) {
		try {
			const testBlob = new Blob( [ '' ], {
				type: 'application/javascript',
			} );
			const testUrl = URL.createObjectURL( testBlob );
			try {
				const testWorker = new Worker( testUrl );
				testWorker.terminate();
			} finally {
				URL.revokeObjectURL( testUrl );
			}
		} catch {
			cachedResult = {
				supported: false,
				reason: "The site's Content Security Policy (CSP) does not allow blob: workers. The worker-src directive must include blob: to enable client-side media processing.",
			};
			return cachedResult;
		}
	}

	cachedResult = { supported: true };
	return cachedResult;
}

/**
 * Returns whether client-side media processing is supported.
 *
 * This is a convenience function that returns just the boolean result.
 *
 * @return Whether client-side media processing is supported.
 */
export function isClientSideMediaSupported(): boolean {
	return detectClientSideMediaSupport().supported;
}

/**
 * Detects whether the browser can decode HEIC images via canvas APIs.
 *
 * This checks for createImageBitmap and OffscreenCanvas support,
 * which are sufficient to convert HEIC to JPEG without VIPS/WASM.
 * Safari supports both APIs and can natively decode HEIC via
 * createImageBitmap(), leveraging macOS platform codecs.
 *
 * @return Whether HEIC canvas-based processing is supported.
 */
export function isHeicCanvasSupported(): boolean {
	return (
		typeof createImageBitmap !== 'undefined' &&
		typeof OffscreenCanvas !== 'undefined'
	);
}

/**
 * Clears the cached feature detection result.
 *
 * This is primarily useful for testing purposes.
 */
export function clearFeatureDetectionCache(): void {
	cachedResult = null;
}

/**
 * Estimated bytes of WASM memory required per decoded pixel.
 *
 * A decoded image needs roughly width * height * 4 bytes (RGBA) in memory,
 * plus additional working buffers while vips processes and re-encodes it.
 * Four bytes per pixel is a deliberately conservative lower bound.
 */
const BYTES_PER_PIXEL = 4;

/**
 * Memory budget (in bytes) for processing interlaced images client-side.
 *
 * wasm-vips is hard-capped at 1 GiB of WASM memory. Progressive JPEGs and
 * Adam7-interlaced PNGs cannot be decoded with shrink-on-load, so the entire
 * image must be buffered at once. A tighter ~0.5 GiB budget leaves headroom
 * for the encode step and avoids the out-of-memory failures these images hit.
 */
const INTERLACED_MEMORY_BUDGET = 0.5 * 1024 * 1024 * 1024;

/**
 * Memory budget (in bytes) for processing non-interlaced images client-side.
 *
 * Baseline images can be shrunk during decode, so vips needs far less peak
 * memory. A generous ~0.9 GiB budget acts as a backstop against extreme sizes
 * while leaving the vast majority of real-world uploads on the client.
 */
const BASELINE_MEMORY_BUDGET = 0.9 * 1024 * 1024 * 1024;

/**
 * Determines whether an image is too large to process client-side.
 *
 * Very large images, especially interlaced/progressive ones, can exceed the
 * 1 GiB wasm-vips memory cap and fail to process. Such images are better
 * handled by the server, which has no comparable per-image memory ceiling.
 *
 * @param dimensions The image's parsed dimensions and interlacing.
 * @return Whether the image's estimated memory use exceeds the client budget.
 */
export function exceedsClientProcessingMemory(
	dimensions: ImageDimensions
): boolean {
	const { width, height, interlaced } = dimensions;
	const estimatedBytes = width * height * BYTES_PER_PIXEL;
	const budget = interlaced
		? INTERLACED_MEMORY_BUDGET
		: BASELINE_MEMORY_BUDGET;
	return estimatedBytes > budget;
}
