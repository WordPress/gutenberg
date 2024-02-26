/**
 * WordPress dependencies
 */
import { useContext, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';
import type { SlotKey } from './types';

/**
 * React hook returning the active slot given a name.
 *
 * @param name Slot name.
 * @return Slot object.
 */
const useSlot = ( name: SlotKey ) => {
	const { getSlot, subscribe } = useContext( SlotFillContext );
	return useSyncExternalStore(
		subscribe,
		() => getSlot( name ),
		() => getSlot( name )
	);
};

export default useSlot;
