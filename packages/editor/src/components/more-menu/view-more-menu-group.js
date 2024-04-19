/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: ViewMoreMenuGroup, Slot } = createSlotFill(
	Symbol( 'ToolsMoreMenuGroup' )
);

ViewMoreMenuGroup.Slot = ( { fillProps } ) => <Slot fillProps={ fillProps } />;

export default ViewMoreMenuGroup;
