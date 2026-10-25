import { createSlotFill } from '@wordpress/components';

const { Fill: ViewMoreMenuGroup, Slot } = createSlotFill(
	Symbol( 'ViewMoreMenuGroup' )
);

ViewMoreMenuGroup.Slot = Slot;

export default ViewMoreMenuGroup;
