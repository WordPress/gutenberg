// @ts-nocheck
/**
 * External dependencies
 */
import { useSnapshot } from 'valtio';

/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

export default function useSlot( name ) {
	const registry = useContext( SlotFillContext );
	const slots = useSnapshot( registry.slots, { sync: true } );
	// The important bit here is that the `useSnapshot` call ensures that the
	// hook only causes a re-render if the slot with the given name changes,
	// not any other slot.
	const slot = slots.get( name );

	const api = useMemo(
		() => ( {
			updateSlot: ( fillProps ) => registry.updateSlot( name, fillProps ),
			unregisterSlot: ( ref ) => registry.unregisterSlot( name, ref ),
			registerFill: ( ref ) => registry.registerFill( name, ref ),
			unregisterFill: ( ref ) => registry.unregisterFill( name, ref ),
		} ),
		[ name, registry ]
	);

	return {
		...slot,
		...api,
	};
}
