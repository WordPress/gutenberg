/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	createSlotFill,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'EllipsisMenu' );

function EllipsisMenuSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

const EllipsisMenu = ifBlockEditSelected( Fill );

EllipsisMenu.Slot = EllipsisMenuSlot;

export default EllipsisMenu;
