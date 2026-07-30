// Run all tests with development tools enabled.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

if ( typeof globalThis.window !== 'undefined' ) {
	globalThis.window.tinyMCEPreInit = {
		baseURL: 'about:blank',
	};

	globalThis.window.setImmediate = function ( callback ) {
		return setTimeout( callback, 0 );
	};

	globalThis.window.requestIdleCallback = function requestIdleCallback(
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

	globalThis.window.cancelIdleCallback = function cancelIdleCallback(
		handle
	) {
		return clearTimeout( handle );
	};

	globalThis.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		addEventListener: () => {},
		removeListener: () => {},
		removeEventListener: () => {},
	} );

	globalThis.window.userSettings = { uid: 1 };
}
