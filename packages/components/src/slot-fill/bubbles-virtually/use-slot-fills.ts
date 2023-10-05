/**
 * External dependencies
 */
import { useSnapshot } from 'valtio';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type { SlotKey } from '../types';

export default function useSlotFills( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	const fills = useSnapshot( registry.fills, { sync: true } );
	// The important bit here is that this call ensures that the hook
	// only causes a re-render if the "fills" of a given slot name
	// change change, not any fills.
	return fills.get( name );
}
