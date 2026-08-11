import ResizeObserverPolyfill from 'resize-observer-polyfill';
import { afterAll, beforeAll, vi } from 'vitest';

function mockCSSSupports() {
	const originalCSS = globalThis.CSS;
	const originalSupports = globalThis.CSS?.supports;

	beforeAll( () => {
		if ( ! globalThis.CSS ) {
			Reflect.set( globalThis, 'CSS', {} );
		}
		Reflect.set(
			globalThis.CSS,
			'supports',
			vi.fn( () => false )
		);
	} );

	afterAll( () => {
		if ( originalSupports ) {
			Reflect.set( globalThis.CSS, 'supports', originalSupports );
		} else if ( originalCSS ) {
			Reflect.deleteProperty( globalThis.CSS, 'supports' );
		} else {
			Reflect.deleteProperty( globalThis, 'CSS' );
		}
	} );
}

function mockMatchMedia() {
	if ( typeof window === 'undefined' ) {
		return;
	}

	const originalMatchMedia = window.matchMedia;
	const mockedMatchMedia = vi.fn( ( query ) => ( {
		matches: /prefers-reduced-motion/.test( query ),
		media: query,
		onchange: null,
		addListener: vi.fn(),
		addEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
		removeListener: vi.fn(),
		removeEventListener: vi.fn(),
	} ) );

	Reflect.set( window, 'matchMedia', mockedMatchMedia );

	afterAll( () => {
		if ( originalMatchMedia ) {
			Reflect.set( window, 'matchMedia', originalMatchMedia );
		} else {
			Reflect.deleteProperty( window, 'matchMedia' );
		}
	} );
}

function mockResizeObserver() {
	const originalResizeObserver = globalThis.ResizeObserver;

	beforeAll( () => {
		Reflect.set( globalThis, 'ResizeObserver', ResizeObserverPolyfill );
	} );

	afterAll( () => {
		if ( originalResizeObserver ) {
			Reflect.set( globalThis, 'ResizeObserver', originalResizeObserver );
		} else {
			Reflect.deleteProperty( globalThis, 'ResizeObserver' );
		}
	} );
}

function mockScrollIntoView() {
	const originalScrollIntoView = globalThis.Element.prototype.scrollIntoView;

	beforeAll( () => {
		Reflect.set( globalThis.Element.prototype, 'scrollIntoView', vi.fn() );
	} );

	afterAll( () => {
		if ( originalScrollIntoView ) {
			Reflect.set(
				globalThis.Element.prototype,
				'scrollIntoView',
				originalScrollIntoView
			);
		} else {
			Reflect.deleteProperty(
				globalThis.Element.prototype,
				'scrollIntoView'
			);
		}
	} );
}

class FakeDOMRectList extends Array {
	/**
	 * @param {number} index Index of the rectangle to return.
	 * @return {DOMRect | null} The rectangle at the requested index.
	 */
	item( index ) {
		return this[ index ] ?? null;
	}
}

/**
 * @param {Element} element Element to inspect.
 * @return {boolean} Whether the element has a layout box.
 */
function hasAssociatedLayoutBox( element ) {
	if ( ! element.isConnected ) {
		return false;
	}

	let current = element;
	while ( current ) {
		if (
			current instanceof globalThis.HTMLElement &&
			( current.hidden || current.style.display === 'none' )
		) {
			return false;
		}

		if (
			current === element &&
			current instanceof globalThis.HTMLElement &&
			current.style.display === 'contents'
		) {
			return false;
		}

		current = current.parentElement;
	}

	return true;
}

function mockVisibleElements() {
	const originalGetClientRects = globalThis.Element.prototype.getClientRects;

	beforeAll( () => {
		Reflect.set(
			globalThis.Element.prototype,
			'getClientRects',
			function () {
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
			}
		);
	} );

	afterAll( () => {
		Reflect.set(
			globalThis.Element.prototype,
			'getClientRects',
			originalGetClientRects
		);
	} );
}

globalThis.wpVitest = {
	mockCSSSupports,
	mockMatchMedia,
	mockResizeObserver,
	mockScrollIntoView,
	mockVisibleElements,
};

if ( typeof globalThis.window !== 'undefined' ) {
	globalThis.window.tinyMCEPreInit = {
		baseURL: 'about:blank',
	};
	globalThis.window.userSettings = { uid: 1 };
}
