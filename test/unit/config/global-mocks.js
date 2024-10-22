/**
 * External dependencies
 */
import { TextDecoder, TextEncoder } from 'node:util';
import { Blob as BlobPolyfill, File as FilePolyfill } from 'node:buffer';

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch: jest.fn(),
	};
} );

/**
 * client-zip is meant to be used in a browser and is therefore released as an ES6 module only,
 * in order to use it in node environment, we need to mock it.
 * See: https://github.com/Touffy/client-zip/issues/28
 */
jest.mock( 'client-zip', () => ( {
	downloadZip: jest.fn(),
} ) );

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

// Override jsdom built-ins with native node implementation.
global.Blob = BlobPolyfill;
global.File = FilePolyfill;
