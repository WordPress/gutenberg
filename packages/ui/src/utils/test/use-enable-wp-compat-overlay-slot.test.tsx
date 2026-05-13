import { render } from '@testing-library/react';
import {
	WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE,
	getWpCompatOverlaySlot,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../wp-compat-overlay-slot';
import { useEnableWpCompatOverlaySlot } from '../use-enable-wp-compat-overlay-slot';

const internalWindow = window as unknown as {
	__wpUiCompatOverlaySlotEnabled?: boolean;
};

// The slot is identified by a data attribute (cross-tooling marker, not a
// user-facing role/text), so direct DOM queries are appropriate here —
// Testing Library's role/text accessors don't apply.
/* eslint-disable testing-library/no-node-access */

function findSlots(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll< HTMLElement >(
			`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
		)
	);
}

function HookHost() {
	useEnableWpCompatOverlaySlot();
	return null;
}

describe( 'useEnableWpCompatOverlaySlot', () => {
	afterEach( () => {
		__resetWpCompatOverlaySlotCacheForTests();
		findSlots().forEach( ( el ) => el.remove() );
		delete internalWindow.__wpUiCompatOverlaySlotEnabled;
	} );

	it( 'enables the slot once mounted, so getWpCompatOverlaySlot() returns the slot', () => {
		expect( getWpCompatOverlaySlot() ).toBeNull();

		render( <HookHost /> );

		const slot = getWpCompatOverlaySlot();
		expect( slot ).not.toBeNull();
		expect( slot?.parentElement ).toBe( document.body );
		expect( findSlots() ).toHaveLength( 1 );
	} );

	it( 'is idempotent across multiple components calling the hook', () => {
		render(
			<>
				<HookHost />
				<HookHost />
				<HookHost />
			</>
		);

		expect( getWpCompatOverlaySlot() ).not.toBeNull();
		expect( findSlots() ).toHaveLength( 1 );
	} );

	it( 'leaves the slot enabled after the hook caller unmounts (one-way opt-in)', () => {
		// The slot is shared infrastructure across all `@wordpress/ui`
		// consumers in the document; a single component shouldn't be
		// able to disable it for everyone else once enabled. This test
		// pins that one-way behavior — unmounting the hook caller does
		// not flip the gate back off.
		const { unmount } = render( <HookHost /> );

		expect( getWpCompatOverlaySlot() ).not.toBeNull();

		unmount();

		expect( internalWindow.__wpUiCompatOverlaySlotEnabled ).toBe( true );
		expect( getWpCompatOverlaySlot() ).not.toBeNull();
	} );
} );

/* eslint-enable testing-library/no-node-access */
