import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'EditWidgetsToolsMoreMenuGroup'
);

ToolsMoreMenuGroup.Slot = Slot;

export default ToolsMoreMenuGroup;
