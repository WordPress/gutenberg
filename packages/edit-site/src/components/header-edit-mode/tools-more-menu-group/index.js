/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'EditSiteToolsMoreMenuGroup'
);

ToolsMoreMenuGroup.Slot = ( { fillProps } ) => (
	<Slot fillProps={ fillProps }>
		{ ( fills ) => fills && fills.length > 0 }
	</Slot>
);

export default ToolsMoreMenuGroup;
