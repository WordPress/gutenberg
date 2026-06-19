/**
 * External dependencies
 */
import { TextDecoder, TextEncoder } from 'node:util';
import { Blob as BlobPolyfill, File as FilePolyfill } from 'node:buffer';
import timezoneMock from 'timezone-mock';

/**
 * Configure timezone-mock to handle Date subclasses (like UTCDateMini) correctly.
 * MockDate constructor normally rejects object arguments, but date-fns v4
 * often reconstructs dates using `new date.constructor(date)`.
 * The fallbackFn allows us to intercept these and use the underlying timestamp.
 *
 * @see https://github.com/WordPress/gutenberg/issues/78005
 */
const OriginalDate = globalThis.Date;
timezoneMock.options( {
	fallbackFn: ( p ) => {
		if ( p instanceof OriginalDate ) {
			return new timezoneMock._Date( p.valueOf() );
		}
		// Re-raise the original assertion behavior for unsupported shapes.
		throw new Error(
			`Unhandled type passed to MockDate constructor: ${ typeof p }`
		);
	},
} );

// ESLint v10's RuleTester uses structuredClone, which is not available in
// the jsdom test environment. Polyfill it using JSON serialization.
if ( typeof globalThis.structuredClone === 'undefined' ) {
	globalThis.structuredClone = ( value ) =>
		JSON.parse( JSON.stringify( value ) );
}

jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch: jest.fn(),
	};
} );

jest.mock( '@wordpress/block-editor/src/hooks/list-view', () => {
	return {
		__esModule: true,
		LIST_VIEW_SUPPORT_KEY: 'listView',
		hasListViewSupport: jest.fn( () => false ),
		ListViewPanel: jest.fn( () => null ),
		default: {
			edit: jest.fn( () => null ),
			hasSupport: jest.fn( () => false ),
			attributeKeys: [],
		},
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
 * A minimal, constructable DOMRectList implementation. The browser-native
 * implementation is not constructable, and DOMRectList differ from arrays.
 *
 * @see https://drafts.csswg.org/geometry/#DOMRectList
 */
class FakeDOMRectList extends Array {
	/**
	 * @param {number} index The index of the DOMRect to return.
	 *
	 * @return {DOMRect | null} The DOMRect at the given index, or null if the
	 *                          given index is out of bounds.
	 */
	item( index ) {
		return this[ index ] ?? null;
	}
}

/**
 * Checks if an element has an associated layout box.
 *
 * The checks intentionally avoid `window.getComputedStyle`, which is very slow
 * in JSDOM. Instead, we check visibility based on accessible attributes and
 * inline styles. The trade-off is that this doesn't fully resolve visibility
 * applied through CSS styles, though generally we do not rely on stylesheet
 * styles in tests.
 *
 * @param {HTMLElement} element The element to check.
 * @return {boolean} Whether the element has an associated layout box.
 */
function hasAssociatedLayoutBox( element ) {
	if ( ! element.isConnected ) {
		return false;
	}

	/** @type {HTMLElement | null} */
	let current = element;
	while ( current ) {
		if ( current.hidden ) {
			return false;
		}

		if ( current.style?.display === 'none' ) {
			return false;
		}

		if ( current === element && current.style?.display === 'contents' ) {
			return false;
		}

		current = current.parentElement;
	}

	return true;
}

// The following jsdom-targeted setup is skipped when a test opts into
// `@jest-environment node` so SSR-style tests can run under this config.
if ( typeof window !== 'undefined' ) {
	// jsdom lacks Element.getAnimations (needed by Base UI ScrollArea ≥1.3)
	if ( ! global.HTMLElement.prototype.getAnimations ) {
		global.HTMLElement.prototype.getAnimations = () => [];
	}

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

	/**
	 * Polyfill Element#getClientRects to minimally emulate element visibility.
	 *
	 * JSDOM does not have a layout engine, so visible elements otherwise report
	 * no client rects and can be treated as hidden by focusability checks.
	 *
	 * @see https://github.com/jsdom/jsdom/issues/653
	 * @see https://github.com/jsdom/jsdom/issues/1322
	 */
	global.Element.prototype.getClientRects = function () {
		const rects = [];
		if ( hasAssociatedLayoutBox( this ) ) {
			rects.push( {
				bottom: 1,
				height: 1,
				left: 0,
				right: 1,
				top: 0,
				width: 1,
				x: 0,
				y: 0,
			} );
		}

		return new FakeDOMRectList( ...rects );
	};
}

if ( ! global.TextDecoder ) {
	global.TextDecoder = TextDecoder;
}
if ( ! global.TextEncoder ) {
	global.TextEncoder = TextEncoder;
}

// Override jsdom built-ins with native node implementation.
global.Blob = BlobPolyfill;
global.File = FilePolyfill;

/**
 * Mock `userEvent.setup()` to fix the `HTMLElement.prototype` properties
 * that `@testing-library/user-event` makes non-writable, which breaks
 * `@ariakit/test` and other code that tries to override `focus` and `blur`.
 * @see https://github.com/testing-library/user-event/pull/1265
 *
 * Kept at the module top-level so babel-jest hoists it above imports. The
 * factory falls back to a passthrough when there is no DOM (`@jest-environment
 * node`), since the real `@testing-library/user-event` requires a browser-like
 * global and the prototype patching would also fail.
 */
jest.mock( '@testing-library/user-event', () => {
	if ( typeof globalThis.window === 'undefined' ) {
		return { __esModule: true };
	}
	const actual = jest.requireActual( '@testing-library/user-event' );
	const patchedUserEvent = {
		...actual.userEvent,
		setup( ...args ) {
			const user = actual.userEvent.setup( ...args );
			const { focus, blur } = global.HTMLElement.prototype;
			Object.defineProperties( global.HTMLElement.prototype, {
				focus: {
					configurable: true,
					value: focus,
					writable: true,
				},
				blur: {
					configurable: true,
					value: blur,
					writable: true,
				},
			} );
			return user;
		},
	};
	return {
		...actual,
		userEvent: patchedUserEvent,
		default: patchedUserEvent,
		__esModule: true,
	};
} );
