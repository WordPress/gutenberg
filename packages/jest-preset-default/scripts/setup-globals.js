// Run all tests with development tools enabled.
global.SCRIPT_DEBUG = true;

// These are necessary to load TinyMCE successfully.
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};

global.window.setImmediate = function ( callback ) {
	return setTimeout( callback, 0 );
};

global.window.requestAnimationFrame = function requestAnimationFrame(
	callback
) {
	// eslint-disable-next-line no-restricted-syntax
	const randomDelay = Math.round( ( Math.random() * 1_000 ) / 60 );

	return setTimeout( () => callback( Date.now() ), randomDelay );
};

global.window.cancelAnimationFrame = function cancelAnimationFrame( handle ) {
	return clearTimeout( handle );
};

// Ignoring `options` argument since we unconditionally schedule this ASAP.
global.window.requestIdleCallback = function requestIdleCallback( callback ) {
	const start = Date.now();

	return setTimeout(
		() =>
			callback( {
				didTimeout: false,
				timeRemaining: () => Math.max( 0, 50 - ( Date.now() - start ) ),
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
