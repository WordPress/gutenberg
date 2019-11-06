/**
 * WordPress dependencies
 */
import { createToolbarSlotFill, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createToolbarSlotFill( 'BlockControls' );

const BlockControlsFill = ( { controls, children } ) => (
	<Fill>
		<ToolbarGroup controls={ controls } />
		{ children }
	</Fill>
);

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = Slot;

export default BlockControls;
