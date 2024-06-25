/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';
import { useObservableValue } from '@wordpress/compose';

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
	const slot = useObservableValue( registry.slots, name );

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
