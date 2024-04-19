/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type { SlotKey } from '../types';
import { useObservableValue } from './observable-map';

export default function useSlotFills( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	return useObservableValue( registry.fills, name );
}
