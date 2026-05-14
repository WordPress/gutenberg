import {
	getWpCompatOverlaySlot,
	WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../wp-compat-overlay-slot';

/**
 * Typed accessor for the internal opt-in flag the helper reads. The flag
 * is intentionally undeclared on the global `Window` interface — the
 * public API is `useEnableWpCompatOverlaySlot()` (tested separately) — so
 * tests that exercise the gating mechanism directly stay behind this
 * cast, mirroring how the helper itself reads the flag.
 */
const internalWindow = window as unknown as {
	__wpUiCompatOverlaySlotEnabled?: unknown;
};

/**
 * Typed accessor for the WordPress runtime global the auto-detect heuristic
 * reads. Mirrors the helper's local `WpEnvironmentWindow` cast pattern (kept
 * off the global `Window` interface to avoid leaking a `Window.wp`
 * augmentation into downstream TS consumers via the package's published
 * types). Tests use this accessor to plant / observe the runtime shape the
 * heuristic inspects.
 */
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
			// `typeof null === 'object'` so the check needs an explicit null
			// guard. This test pins that behavior.
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

		// The cross-origin `window.top` throw path (where `.wp` access
		// throws because the top window is in another origin) isn't unit-
		// tested: jsdom defines `window.top` as a non-configurable, non-
		// writable getter, so neither `Object.defineProperty` nor
		// `jest.spyOn(window, 'top', 'get')` nor `jest.replaceProperty`
		// can simulate the throw. The helper's `try/catch` is readable in
		// place and the same-origin happy path (`window.top === window` in
		// jsdom, exercised by every other auto-detect test in this suite)
		// covers the no-throw branch. Real cross-origin embeddings are
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

			// The recreated element should now be cached: a third call must
			// return it directly without creating a third slot.
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
			// Drives the `cachedSlot.ownerDocument !== ownerDocument` branch
			// and the subsequent `if ( cachedSlot?.isConnected )
			// cachedSlot.remove();` cleanup. Triggered in real environments
			// by a runtime-detected switch in the owning document (e.g. a
			// jsdom test teardown that tears down the realm, or a host
			// swapping the active document). Simulated here by moving the
			// cached slot into a foreign parsed document so its
			// `ownerDocument` differs from the helper's local `document`
			// while staying `isConnected` to that foreign document — the
			// exact shape the cleanup branch was written to handle.
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
			// Simulate a second `@wordpress/ui` package instance having
			// already created the slot before this instance's call. The
			// module-level `cachedSlot` is null, but the DOM has the slot.
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
					// jsdom typically defines `body` on Document.prototype; if
					// it isn't present, fall back to deleting the override so
					// `document.body` resolves to the live element again.
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
