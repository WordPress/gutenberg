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
import type {
	SlotFillBubblesVirtuallyFillRef,
	SlotFillBubblesVirtuallySlotRef,
	FillProps,
	SlotKey,
} from '../types';

export default function useSlot( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	const slots = useSnapshot( registry.slots, { sync: true } );
	// The important bit here is that the `useSnapshot` call ensures that the
	// hook only causes a re-render if the slot with the given name changes,
	// not any other slot.
	const slot = slots.get( name );

	const api = useMemo(
		() => ( {
			updateSlot: ( fillProps: FillProps ) =>
				registry.updateSlot( name, fillProps ),
			unregisterSlot: ( ref: SlotFillBubblesVirtuallySlotRef ) =>
				registry.unregisterSlot( name, ref ),
			registerFill: ( ref: SlotFillBubblesVirtuallyFillRef ) =>
				registry.registerFill( name, ref ),
			unregisterFill: ( ref: SlotFillBubblesVirtuallyFillRef ) =>
				registry.unregisterFill( name, ref ),
		} ),
		[ name, registry ]
	);

	return {
		...slot,
		...api,
	};
}
