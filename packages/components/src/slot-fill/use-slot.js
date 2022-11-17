// @ts-nocheck
/**
 * WordPress dependencies
 */
import { useContext, useState, useEffect } from '@wordpress/element';

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
	const [ slot, setSlot ] = useState( getSlot( name ) );

	useEffect( () => {
		setSlot( getSlot( name ) );
		const unsubscribe = subscribe( () => {
			setSlot( getSlot( name ) );
		} );

		return unsubscribe;
		// Ignore reason: Modifying this dep array could introduce unexpected changes in behavior,
		// so we'll leave it as=is until the hook can be properly refactored for exhaustive-deps.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ name ] );

	return slot;
};

export default useSlot;
