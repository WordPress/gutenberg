/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'EditWidgetsToolsMoreMenuGroup'
);

ToolsMoreMenuGroup.Slot = ( { fillProps } ) => (
	<Slot fillProps={ fillProps }>
		{ ( fills ) => fills.length > 0 && fills }
	</Slot>
);

export default ToolsMoreMenuGroup;
