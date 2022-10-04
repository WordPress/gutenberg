// @ts-nocheck
/**
 * External dependencies
 */
import { useSnapshot } from 'valtio';

/**
 * WordPress dependencies
 */
import { useCallback, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

export default function useSlot( name ) {
	const registry = useContext( SlotFillContext );
	const slots = useSnapshot( registry.slots, { sync: true } );
	// The important bit here is that this call ensures
	// the hook only causes a re-render if the slot
	// with the given name change, not any other slot.
	const slot = slots.get( name );

	const updateSlot = useCallback(
		( fillProps ) => {
			registry.updateSlot( name, fillProps );
		},
		[ name, registry.updateSlot ]
	);

	const unregisterSlot = useCallback(
		( slotRef ) => {
			registry.unregisterSlot( name, slotRef );
		},
		[ name, registry.unregisterSlot ]
	);

	const registerFill = useCallback(
		( fillRef ) => {
			registry.registerFill( name, fillRef );
		},
		[ name, registry.registerFill ]
	);

	const unregisterFill = useCallback(
		( fillRef ) => {
			registry.unregisterFill( name, fillRef );
		},
		[ name, registry.unregisterFill ]
	);

	return {
		...slot,
		updateSlot,
		unregisterSlot,
		registerFill,
		unregisterFill,
	};
}
