/**
 * WordPress dependencies
 */
import { createSlotFill, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockControls' );

const BlockControlsFill = ( { controls, children } ) => (
	<Fill>
		<ToolbarGroup controls={ controls } />
		{ children }
	</Fill>
);

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = Slot;

export default BlockControls;
