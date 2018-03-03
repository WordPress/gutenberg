// Bootstrap server-registered blocks
global.window._wpBlocks = require( 'blocks/test/server-registered.json' );

// Temporary: Most blocks are using deprecated `children` matcher and will log
// as deprecated. Mock deprecated module to bypass logging.
jest.mock( '@wordpress/utils', () => {
	const utils = require.requireActual( '@wordpress/utils' );
	return {
		...utils,
		deprecated( feature ) {
			if ( /^(Children|Node) attribute source$/.test( feature ) ) {
				return;
			}

			return utils.deprecated( ...arguments );
		},
	};
} );
