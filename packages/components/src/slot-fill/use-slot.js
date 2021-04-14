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
	}, [ name ] );

	return slot;
};

export default useSlot;
