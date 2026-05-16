import {
	getWpCompatOverlaySlot,
	WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../wp-compat-overlay-slot';

// Typed accessors mirroring the helper's local casts: the flag and the
// `wp` global are both intentionally undeclared on `Window` so the
// package's published types don't leak augmentations.
const internalWindow = window as unknown as {
	__wpUiCompatOverlaySlotEnabled?: unknown;
};
const wpEnvWindow = window as unknown as {
	wp?: { components?: unknown };
};

function findSlots(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll< HTMLElement >(
			`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
		)
	);
}

describe( 'getWpCompatOverlaySlot', () => {
	afterEach( () => {
		__resetWpCompatOverlaySlotCacheForTests();
		findSlots().forEach( ( el ) => el.remove() );
		delete internalWindow.__wpUiCompatOverlaySlotEnabled;
		delete wpEnvWindow.wp;
	} );

	describe( 'explicit opt-in via internal flag', () => {
		it( 'returns undefined when no gate is open', () => {
			expect( getWpCompatOverlaySlot() ).toBeUndefined();
			expect( findSlots() ).toHaveLength( 0 );
		} );

		it( 'returns undefined when the flag is explicitly false', () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = false;

			expect( getWpCompatOverlaySlot() ).toBeUndefined();
			expect( findSlots() ).toHaveLength( 0 );
		} );

		it.each( [
			[ '1', 1 ],
			[ "'yes'", 'yes' ],
			[ 'null', null ],
			[ 'undefined', undefined ],
		] )(
			'returns undefined when the flag is %s (strict-equality gate)',
			( _label, value ) => {
				internalWindow.__wpUiCompatOverlaySlotEnabled = value;

				expect( getWpCompatOverlaySlot() ).toBeUndefined();
				expect( findSlots() ).toHaveLength( 0 );
			}
		);

		it( 'creates and returns the slot when the flag is true', () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = true;

			const slot = getWpCompatOverlaySlot();

			expect( slot ).toBeDefined();
			expect( slot ).toBeInstanceOf( HTMLDivElement );
			expect( slot?.parentElement ).toBe( document.body );
			expect(
				slot?.hasAttribute( WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE )
			).toBe( true );
			expect( findSlots() ).toHaveLength( 1 );
		} );
	} );

	describe( 'WordPress environment auto-detection', () => {
		it( 'auto-enables when window.wp.components is an object', () => {
			wpEnvWindow.wp = { components: {} };

			const slot = getWpCompatOverlaySlot();

			expect( slot ).toBeDefined();
			expect( findSlots() ).toHaveLength( 1 );
		} );

		it.each( [
			[ 'a string', 'something' ],
			[ 'a number', 42 ],
			[ 'a boolean', true ],
			[ 'undefined', undefined ],
		] )(
			'does not auto-enable when window.wp.components is %s',
			( _label, value ) => {
				wpEnvWindow.wp = { components: value };

				expect( getWpCompatOverlaySlot() ).toBeUndefined();
				expect( findSlots() ).toHaveLength( 0 );
			}
		);

		it( 'does not auto-enable when window.wp.components is null', () => {
			// `typeof null === 'object'` — pins the explicit null guard.
			wpEnvWindow.wp = { components: null };

			expect( getWpCompatOverlaySlot() ).toBeUndefined();
			expect( findSlots() ).toHaveLength( 0 );
		} );

		it( 'does not auto-enable when window.wp itself is missing', () => {
			expect( getWpCompatOverlaySlot() ).toBeUndefined();
			expect( findSlots() ).toHaveLength( 0 );
		} );

		it( 'opens the gate even with the explicit flag absent', () => {
			wpEnvWindow.wp = { components: {} };
			expect(
				internalWindow.__wpUiCompatOverlaySlotEnabled
			).toBeUndefined();

			expect( getWpCompatOverlaySlot() ).toBeDefined();
		} );

		// The cross-origin `window.top` throw path isn't unit-tested:
		// jsdom's `window.top` is a non-configurable, non-writable getter,
		// so the throw can't be simulated. Same-origin happy path is
		// covered by every other auto-detect test; cross-origin is
		// validated via manual smoke testing.
	} );

	describe( 'singleton caching', () => {
		beforeEach( () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = true;
		} );

		it( 'returns the same element on repeated calls', () => {
			const first = getWpCompatOverlaySlot();
			const second = getWpCompatOverlaySlot();
			const third = getWpCompatOverlaySlot();

			expect( first ).toBeDefined();
			expect( second ).toBe( first );
			expect( third ).toBe( first );
			expect( findSlots() ).toHaveLength( 1 );
		} );

		it( 'creates a fresh element when the previous one was removed from the DOM, and re-caches it', () => {
			const first = getWpCompatOverlaySlot();
			expect( first ).toBeDefined();

			first?.remove();
			expect( findSlots() ).toHaveLength( 0 );

			const second = getWpCompatOverlaySlot();

			expect( second ).toBeDefined();
			expect( second ).not.toBe( first );
			expect( second?.isConnected ).toBe( true );
			expect( findSlots() ).toHaveLength( 1 );

			// A third call returns the cached recreated slot directly.
			const third = getWpCompatOverlaySlot();
			expect( third ).toBe( second );
			expect( findSlots() ).toHaveLength( 1 );
		} );

		it( 'returns undefined after the gate is closed, even if a slot was previously created', () => {
			const slot = getWpCompatOverlaySlot();
			expect( slot ).toBeDefined();

			delete internalWindow.__wpUiCompatOverlaySlotEnabled;

			expect( getWpCompatOverlaySlot() ).toBeUndefined();
		} );

		it( 'invalidates the cache and detaches the stale slot when the cached element belongs to a different document', () => {
			// Exercises the foreign-document cleanup branch by moving the
			// cached slot into a parsed foreign document, so it stays
			// `isConnected` but `ownerDocument` differs from the helper's
			// local `document`.
			const first = getWpCompatOverlaySlot();
			expect( first ).toBeDefined();

			const foreignDocument = new DOMParser().parseFromString(
				'<!DOCTYPE html><html><body></body></html>',
				'text/html'
			);
			foreignDocument.body.appendChild(
				foreignDocument.adoptNode( first! )
			);
			expect( first?.ownerDocument ).toBe( foreignDocument );
			expect( first?.isConnected ).toBe( true );
			expect( findSlots() ).toHaveLength( 0 );

			const second = getWpCompatOverlaySlot();

			expect( second ).toBeDefined();
			expect( second ).not.toBe( first );
			expect( second?.ownerDocument ).toBe( document );
			expect( second?.parentElement ).toBe( document.body );
			expect( first?.isConnected ).toBe( false );
			expect( foreignDocument.body.children ).toHaveLength( 0 );
			expect( findSlots() ).toHaveLength( 1 );
		} );
	} );

	describe( 'DOM-level singleton (cross-instance coordination)', () => {
		beforeEach( () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = true;
		} );

		it( 'adopts a pre-existing slot element rather than appending a duplicate', () => {
			// Simulates a second `@wordpress/ui` instance creating the slot
			// first: `cachedSlot` is null but the slot already exists in the DOM.
			const preExisting = document.createElement( 'div' );
			preExisting.setAttribute( WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE, '' );
			document.body.appendChild( preExisting );

			const slot = getWpCompatOverlaySlot();

			expect( slot ).toBe( preExisting );
			expect( findSlots() ).toHaveLength( 1 );
		} );

		it( 'caches the adopted slot for subsequent calls', () => {
			const preExisting = document.createElement( 'div' );
			preExisting.setAttribute( WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE, '' );
			document.body.appendChild( preExisting );

			const first = getWpCompatOverlaySlot();
			const second = getWpCompatOverlaySlot();

			expect( first ).toBe( preExisting );
			expect( second ).toBe( preExisting );
			expect( findSlots() ).toHaveLength( 1 );
		} );
	} );

	describe( 'document.body unavailable', () => {
		beforeEach( () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = true;
		} );

		it( 'returns undefined without throwing when document.body is missing', () => {
			const realBody = document.body;
			const bodyDescriptor = Object.getOwnPropertyDescriptor(
				Document.prototype,
				'body'
			);

			Object.defineProperty( document, 'body', {
				configurable: true,
				get: () => null,
			} );

			try {
				expect( () => getWpCompatOverlaySlot() ).not.toThrow();
				expect( getWpCompatOverlaySlot() ).toBeUndefined();
			} finally {
				if ( bodyDescriptor ) {
					Object.defineProperty( document, 'body', bodyDescriptor );
				} else {
					// Fallback if `body` wasn't on Document.prototype.
					delete ( document as unknown as { body: unknown } ).body;
				}
				expect( document.body ).toBe( realBody );
			}
		} );
	} );

	describe( 'DOM identification', () => {
		beforeEach( () => {
			internalWindow.__wpUiCompatOverlaySlotEnabled = true;
		} );

		it( 'tags the element with the data-wp-compat-overlay-slot attribute (no value)', () => {
			const slot = getWpCompatOverlaySlot();

			expect(
				slot?.getAttribute( WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE )
			).toBe( '' );
		} );

		it( 'is discoverable via [data-wp-compat-overlay-slot] selector', () => {
			const slot = getWpCompatOverlaySlot();

			expect(
				document.querySelector(
					`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
				)
			).toBe( slot );
		} );

		it( 'appends the slot to the local document body', () => {
			const slot = getWpCompatOverlaySlot();

			expect( slot?.ownerDocument ).toBe( document );
			expect( slot?.parentElement ).toBe( document.body );
		} );
	} );
} );
