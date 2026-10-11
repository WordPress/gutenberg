import ResizeObserverPolyfill from 'resize-observer-polyfill';
import { afterAll, beforeEach, vi } from 'vitest';

function mockCSSSupports() {
	const originalCSS = globalThis.CSS;
	const originalSupports = globalThis.CSS?.supports;

	const install = () => {
		if ( ! globalThis.CSS ) {
			Reflect.set( globalThis, 'CSS', {} );
		}
		Reflect.set(
			globalThis.CSS,
			'supports',
			vi.fn( () => false )
		);
	};

	install();
	beforeEach( install );
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
	const install = () => {
		Reflect.set(
			window,
			'matchMedia',
			vi.fn( ( query ) => ( {
				matches: /prefers-reduced-motion/.test( query ),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				addEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
				removeListener: vi.fn(),
				removeEventListener: vi.fn(),
			} ) )
		);
	};

	install();
	beforeEach( install );
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

	const install = () => {
		Reflect.set( globalThis, 'ResizeObserver', ResizeObserverPolyfill );
	};

	install();
	beforeEach( install );
	afterAll( () => {
		if ( originalResizeObserver ) {
			Reflect.set( globalThis, 'ResizeObserver', originalResizeObserver );
		} else {
			Reflect.deleteProperty( globalThis, 'ResizeObserver' );
		}
	} );
}

function mockPointerEvent() {
	const originalPointerEvent = globalThis.PointerEvent;

	class PointerEvent extends globalThis.MouseEvent {
		constructor( type, init = {} ) {
			super( type, init );
			this.pointerId = init.pointerId ?? 0;
			this.pointerType = init.pointerType ?? '';
			this.isPrimary = init.isPrimary ?? false;
		}
	}
	const install = () => {
		Reflect.set( globalThis, 'PointerEvent', PointerEvent );
	};

	install();
	beforeEach( install );
	afterAll( () => {
		if ( originalPointerEvent ) {
			Reflect.set( globalThis, 'PointerEvent', originalPointerEvent );
		} else {
			Reflect.deleteProperty( globalThis, 'PointerEvent' );
		}
	} );
}

function mockScrollIntoView() {
	const originalScrollIntoView = globalThis.Element.prototype.scrollIntoView;

	const install = () => {
		Reflect.set( globalThis.Element.prototype, 'scrollIntoView', vi.fn() );
	};

	install();
	beforeEach( install );
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

// Keep these opt-in mocks on `globalThis` so `vi.hoisted()` can call them
// synchronously before static imports run.
globalThis.wpVitest = {
	mockCSSSupports,
	mockMatchMedia,
	mockPointerEvent,
	mockResizeObserver,
	mockScrollIntoView,
	timers: vi,
};

if ( typeof globalThis.window !== 'undefined' ) {
	// Node 26 has its own `localStorage` and `sessionStorage` globals, which are
	// `undefined` unless Node runs with `--localstorage-file`. The Vitest jsdom
	// environment does not copy a window property over a global that already
	// exists, so point these back at the jsdom window.
	for ( const key of [ 'localStorage', 'sessionStorage' ] ) {
		Object.defineProperty( globalThis, key, {
			configurable: true,
			get: () => globalThis.jsdom.window[ key ],
		} );
	}

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
