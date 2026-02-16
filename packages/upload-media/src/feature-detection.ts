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
			reason: 'WebAssembly is not supported in this browser',
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

	// Check that blob URL workers are allowed by CSP.
	// Security plugins often set a strict worker-src directive that blocks blob: URLs,
	// which would prevent creating the WASM processing worker at runtime.
	if ( typeof window !== 'undefined' && typeof Worker !== 'undefined' ) {
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
