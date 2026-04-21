/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useObservableValue } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from '../context';
import type { SlotKey, SlotRef } from '../types';

export default function useSlot( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	const slot = useObservableValue( registry.slots, name );
	let ref: SlotRef | undefined;
	if ( slot && slot.type === 'portal' ) {
		ref = slot.ref;
	}
	return { ref };
}
