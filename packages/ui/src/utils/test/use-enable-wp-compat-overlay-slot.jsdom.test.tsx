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

// Slot is identified by a data attribute, not a user-facing role/text.
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
		expect( getWpCompatOverlaySlot() ).toBeUndefined();

		render( <HookHost /> );

		const slot = getWpCompatOverlaySlot();
		expect( slot ).toBeDefined();
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

		expect( getWpCompatOverlaySlot() ).toBeDefined();
		expect( findSlots() ).toHaveLength( 1 );
	} );

	it( 'leaves the slot enabled after the hook caller unmounts (one-way opt-in)', () => {
		// Pins the one-way behavior — unmounting must not flip the gate
		// back off; the slot is shared infrastructure.
		const { unmount } = render( <HookHost /> );

		expect( getWpCompatOverlaySlot() ).toBeDefined();

		unmount();

		expect( internalWindow.__wpUiCompatOverlaySlotEnabled ).toBe( true );
		expect( getWpCompatOverlaySlot() ).toBeDefined();
	} );
} );

/* eslint-enable testing-library/no-node-access */
