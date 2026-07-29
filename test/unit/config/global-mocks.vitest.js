/**
 * Node dependencies
 */
import { Blob as BlobPolyfill, File as FilePolyfill } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util';

/**
 * External dependencies
 */
import ResizeObserver from 'resize-observer-polyfill';
import timezoneMock from 'timezone-mock';
import { vi } from 'vitest';

const OriginalDate = globalThis.Date;
timezoneMock.options( {
	fallbackFn: ( parameter ) => {
		if ( parameter instanceof OriginalDate ) {
			return new timezoneMock._Date( parameter.valueOf() );
		}

		throw new Error(
			`Unhandled type passed to MockDate constructor: ${ typeof parameter }`
		);
	},
} );

if ( typeof globalThis.structuredClone === 'undefined' ) {
	globalThis.structuredClone = ( value ) =>
		JSON.parse( JSON.stringify( value ) );
}

vi.mock( '@wordpress/compose', async () => ( {
	...( await vi.importActual( '@wordpress/compose' ) ),
	useViewportMatch: vi.fn(),
} ) );

vi.mock( '@wordpress/block-editor/src/hooks/list-view', () => ( {
	LIST_VIEW_SUPPORT_KEY: 'listView',
	hasListViewSupport: vi.fn( () => false ),
	ListViewPanel: vi.fn( () => null ),
	default: {
		edit: vi.fn( () => null ),
		hasSupport: vi.fn( () => false ),
		attributeKeys: [],
	},
} ) );

vi.mock( 'client-zip', () => ( {
	downloadZip: vi.fn(),
} ) );

globalThis.ResizeObserver = ResizeObserver;

class FakeDOMRectList extends Array {
	item( index ) {
		return this[ index ] ?? null;
	}
}

function hasAssociatedLayoutBox( element ) {
	if ( ! element.isConnected ) {
		return false;
	}

	let current = element;
	while ( current ) {
		if ( current.hidden || current.style?.display === 'none' ) {
			return false;
		}

		if ( current === element && current.style?.display === 'contents' ) {
			return false;
		}

		current = current.parentElement;
	}

	return true;
}

if ( typeof window !== 'undefined' ) {
	window.wp = window.wp || {};
	window.wp.oldEditor = {};

	if ( ! globalThis.HTMLElement.prototype.getAnimations ) {
		globalThis.HTMLElement.prototype.getAnimations = () => [];
	}

	if ( ! globalThis.CSS ) {
		globalThis.CSS = {};
	}
	if ( ! globalThis.CSS.supports ) {
		globalThis.CSS.supports = vi.fn( () => false );
	}

	if ( ! window.DOMRect ) {
		window.DOMRect = class DOMRect {};
	}

	globalThis.Element.prototype.scrollIntoView = vi.fn();
	globalThis.Element.prototype.getClientRects = function () {
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

if ( ! globalThis.TextDecoder ) {
	globalThis.TextDecoder = TextDecoder;
}
if ( ! globalThis.TextEncoder ) {
	globalThis.TextEncoder = TextEncoder;
}

globalThis.Blob = BlobPolyfill;
globalThis.File = FilePolyfill;

vi.mock( '@testing-library/user-event', async () => {
	if ( typeof globalThis.window === 'undefined' ) {
		return {};
	}

	const actual = await vi.importActual( '@testing-library/user-event' );
	const patchedUserEvent = {
		...actual.userEvent,
		setup( ...args ) {
			const user = actual.userEvent.setup( ...args );
			const { focus, blur } = globalThis.HTMLElement.prototype;
			Object.defineProperties( globalThis.HTMLElement.prototype, {
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
	};
} );
