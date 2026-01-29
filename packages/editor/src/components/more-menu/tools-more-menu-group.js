/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } =
	createSlotFill( 'ToolsMoreMenuGroup' );

ToolsMoreMenuGroup.Slot = ( { fillProps } ) => <Slot fillProps={ fillProps } />;

export default ToolsMoreMenuGroup;
