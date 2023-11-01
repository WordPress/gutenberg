/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __unstableBlockToolbarLastItem, Slot } = createSlotFill(
	'__unstableBlockToolbarLastItem'
);

__unstableBlockToolbarLastItem.Slot = Slot;

export default __unstableBlockToolbarLastItem;
