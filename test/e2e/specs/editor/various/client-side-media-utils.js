/**
 * Skip the test unless the client-side media processing pipeline is the
 * active upload path. This mirrors the gate used in the editor's media-upload
 * util: the global flag must be set AND the browser must meet the feature
 * detection requirements (cross-origin isolation, SharedArrayBuffer, Web
 * Workers, WebAssembly).
 *
 * @param {import('@playwright/test').Page}     page         Playwright page.
 * @param {import('@playwright/test').TestType} testInstance The test object for skipping.
 */
async function skipIfClientSideMediaInactive( page, testInstance ) {
	const isActive = await page.evaluate( () => {
		if ( ! window.__clientSideMediaProcessing ) {
			return false;
		}
		// Prefer the package's own detection when available so the gate stays
		// in sync with the editor's runtime decision.
		if (
			window.wp?.uploadMedia &&
			typeof window.wp.uploadMedia.isClientSideMediaSupported ===
				'function'
		) {
			return window.wp.uploadMedia.isClientSideMediaSupported();
		}
		// Fall back to the core preconditions for CSM. These are the signals
		// the package's feature detection inspects first.
		return (
			window.crossOriginIsolated === true &&
			typeof SharedArrayBuffer !== 'undefined' &&
			typeof WebAssembly !== 'undefined' &&
			typeof Worker !== 'undefined'
		);
	} );

	testInstance.skip(
		! isActive,
		'Client-side media processing is not active in this environment'
	);
}

module.exports = { skipIfClientSideMediaInactive };
