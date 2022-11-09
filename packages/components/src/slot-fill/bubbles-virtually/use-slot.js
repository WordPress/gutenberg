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
	const {
		updateSlot: registryUpdateSlot,
		unregisterSlot: registryUnregisterSlot,
		registerFill: registryRegisterFill,
		unregisterFill: registryUnregisterFill,
		...registry
	} = useContext( SlotFillContext );
	const slots = useSnapshot( registry.slots, { sync: true } );
	// The important bit here is that this call ensures
	// the hook only causes a re-render if the slot
	// with the given name change, not any other slot.
	const slot = slots.get( name );

	const updateSlot = useCallback(
		( fillProps ) => {
			registryUpdateSlot( name, fillProps );
		},
		[ name, registryUpdateSlot ]
	);

	const unregisterSlot = useCallback(
		( slotRef ) => {
			registryUnregisterSlot( name, slotRef );
		},
		[ name, registryUnregisterSlot ]
	);

	const registerFill = useCallback(
		( fillRef ) => {
			registryRegisterFill( name, fillRef );
		},
		[ name, registryRegisterFill ]
	);

	const unregisterFill = useCallback(
		( fillRef ) => {
			registryUnregisterFill( name, fillRef );
		},
		[ name, registryUnregisterFill ]
	);

	return {
		...slot,
		updateSlot,
		unregisterSlot,
		registerFill,
		unregisterFill,
	};
}
