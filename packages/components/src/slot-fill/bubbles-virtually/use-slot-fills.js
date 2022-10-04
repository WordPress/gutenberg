// @ts-nocheck
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

export default function useSlotFills( name ) {
	const registry = useContext( SlotFillContext );
	const fills = useSnapshot( registry.fills, { sync: true } );
	return fills.get( name );
}
