jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch: jest.fn(),
	};
} );

/**
 * The new gallery block format is not compatible with the use_BalanceTags option
 * so a flag is set in lib/compat.php to allow disabling the new block in this instance.
 * This flag needs to be mocked here to ensure tests and fixtures run with the v2
 * version of the Gallery block enabled.
 *
 * Note: This should be removed when the minimum required WP version is >= 5.9.
 *
 */
if ( ! window.wp?.galleryBlockV2Enabled ) {
	window.wp = { ...window.wp, galleryBlockV2Enabled: true };
}

global.ResizeObserver = require( 'resize-observer-polyfill' );
