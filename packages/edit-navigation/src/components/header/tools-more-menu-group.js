/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'EditNavigationToolsMoreMenuGroup'
);

ToolsMoreMenuGroup.Slot = ( { fillProps } ) => (
	<Slot fillProps={ fillProps }>{ ( fills ) => fills }</Slot>
);

export default ToolsMoreMenuGroup;
