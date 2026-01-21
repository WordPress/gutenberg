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
 * 3. Cross-origin isolation (required for SharedArrayBuffer in modern browsers)
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

	// Check cross-origin isolation (required for SharedArrayBuffer in modern browsers).
	if (
		typeof window !== 'undefined' &&
		window.crossOriginIsolated === false
	) {
		cachedResult = {
			supported: false,
			reason: 'Cross-origin isolation is not enabled. Required headers: Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Embedder-Policy: credentialless',
		};
		return cachedResult;
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
