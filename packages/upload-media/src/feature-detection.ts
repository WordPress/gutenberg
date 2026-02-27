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
 * This checks for:
 * 1. WebAssembly support (required for wasm-vips)
 * 2. SharedArrayBuffer support (required for WASM threading)
 * 3. CSP compatibility for blob URL workers (required for inline worker creation)
 * 4. Credentialless iframe support (required so cross-origin isolation does not
 *    break third-party embeds). Browsers that lack `credentialless` iframe support
 *    (currently Firefox and Safari) will have client-side media processing disabled
 *    by default. Developers can re-enable the feature via the server-side
 *    `wp_client_side_media_processing_enabled` filter if it works for their site.
 * 5. Device memory (disables on devices with ≤2 GB RAM)
 * 6. Hardware concurrency (disables on devices with fewer than 4 CPU cores)
 * 7. Network conditions (disables when data saver / reduced data mode is on or connection is 3g/2g/slow-2g)
 * 8. Web Worker support (baseline requirement)
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

	// Check credentialless iframe support.
	// Browsers without this (Firefox, Safari) cannot use cross-origin isolation
	// without breaking third-party embeds.
	if (
		typeof window !== 'undefined' &&
		window.HTMLIFrameElement &&
		! ( 'credentialless' in window.HTMLIFrameElement.prototype )
	) {
		cachedResult = {
			supported: false,
			reason: 'Browser does not support credentialless iframes. Cross-origin isolation would break third-party embeds',
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
		navigator.hardwareConcurrency < 4
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
				connection.effectiveType === '2g' ||
				connection.effectiveType === '3g'
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
 * Clears the cached feature detection result.
 *
 * This is primarily useful for testing purposes.
 */
export function clearFeatureDetectionCache(): void {
	cachedResult = null;
}
