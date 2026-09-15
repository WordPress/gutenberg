import { createSlotFill } from '@wordpress/components';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	Symbol( 'ToolsMoreMenuGroup' )
);

ToolsMoreMenuGroup.Slot = Slot;

export default ToolsMoreMenuGroup;
