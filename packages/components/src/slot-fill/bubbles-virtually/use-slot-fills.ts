/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useObservableValue } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type { SlotKey } from '../types';

export default function useSlotFills( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	return useObservableValue( registry.fills, name );
}
