// Run all tests with development tools enabled.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

// The remaining globals all hang off `window`, which only exists when the test
// is using a DOM environment (jsdom). Skip them when running under
// `@jest-environment node`.
if ( typeof global.window !== 'undefined' ) {
	// These are necessary to load TinyMCE successfully.
	global.window.tinyMCEPreInit = {
		// Without this, TinyMCE tries to determine its URL by looking at the
		// <script> tag where it was loaded from, which of course fails here.
		baseURL: 'about:blank',
	};

	global.window.setImmediate = function ( callback ) {
		return setTimeout( callback, 0 );
	};

	// Ignoring `options` argument since we unconditionally schedule this ASAP.
	global.window.requestIdleCallback = function requestIdleCallback(
		callback
	) {
		const start = Date.now();

		return setTimeout(
			() =>
				callback( {
					didTimeout: false,
					timeRemaining: () =>
						Math.max( 0, 50 - ( Date.now() - start ) ),
				} ),
			0
		);
	};

	global.window.cancelIdleCallback = function cancelIdleCallback( handle ) {
		return clearTimeout( handle );
	};

	global.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		addEventListener: () => {},
		removeListener: () => {},
		removeEventListener: () => {},
	} );

	// UserSettings global.
	global.window.userSettings = { uid: 1 };
}
