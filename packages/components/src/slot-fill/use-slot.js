// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useContext, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';

/**
 * React hook returning the active slot given a name.
 *
 * @param {string} name Slot name.
 * @return {Object} Slot object.
 */
const useSlot = ( name ) => {
	const { getSlot, subscribe } = useContext( SlotFillContext );
	return useSyncExternalStore(
		subscribe,
		() => getSlot( name ),
		() => getSlot( name )
	);
};

export default useSlot;
