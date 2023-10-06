/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { createSlotRegistry } from '../provider';
import { SlotComponent } from '../slot';

jest.mock( '../slot' );

describe( 'Provider', () => {
	describe( 'Slot', () => {
		it( 'register SlotComponent', () => {
			const registry = createSlotRegistry();
			const ref = createRef< SlotComponent >();
			render(
				<SlotComponent
					ref={ ref }
					registerSlot={ () => {} }
					unregisterSlot={ () => {} }
					getFills={ () => {
						return [];
					} }
					name="slot-test"
				/>
			);

			const component = ref.current as SlotComponent;

			registry.registerSlot( 'slot-test', component );
			expect( registry.getSlot( 'slot-test' ) ).toBeInstanceOf(
				SlotComponent
			);

			registry.unregisterSlot( 'slot-test', component );
			expect( registry.getSlot( 'slot-test' ) ).toBeUndefined();
		} );
	} );
} );
