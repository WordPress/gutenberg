/**
 * External dependencies
 */
import { TextDecoder, TextEncoder } from 'node:util';

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

/**
 * The following mock is for block integration tests that might render
 * components leveraging DOMRect. For example, the Cover block which now renders
 * its ResizableBox control via the BlockPopover component.
 */
if ( ! window.DOMRect ) {
	window.DOMRect = class DOMRect {};
}

/**
 * Polyfill for Element.scrollIntoView().
 * Necessary because it's not implemented in jsdom, and likely will never be.
 *
 * @see https://github.com/jsdom/jsdom/issues/1695
 */
global.Element.prototype.scrollIntoView = jest.fn();

if ( ! global.TextDecoder ) {
	global.TextDecoder = TextDecoder;
}
if ( ! global.TextEncoder ) {
	global.TextEncoder = TextEncoder;
}
