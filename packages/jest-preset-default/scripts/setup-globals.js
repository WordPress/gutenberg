// Run all tests with development tools enabled.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

// These are necessary to load TinyMCE successfully.
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};

global.window.setImmediate = function ( callback ) {
	return setTimeout( callback, 0 );
};

// Approximate `requestIdleCallback` with `setTimeout`. The browser
// would normally schedule against the next idle frame; we don't have
// one, so we honor the caller's `options.timeout` deadline directly —
// that's the wait callers are willing to accept anyway. Without an
// explicit timeout, fall back to "as soon as the current task yields".
global.window.requestIdleCallback = function requestIdleCallback(
	callback,
	options
) {
	const start = Date.now();
	const delay = options?.timeout ?? 0;

	return setTimeout(
		() =>
			callback( {
				didTimeout: delay > 0,
				timeRemaining: () => Math.max( 0, 50 - ( Date.now() - start ) ),
			} ),
		delay
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
