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

	globalThis.window.userSettings = { uid: 1 };
}
