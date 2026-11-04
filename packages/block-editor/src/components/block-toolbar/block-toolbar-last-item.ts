import { createSlotFill } from '@wordpress/components';
import type { BlockToolbarLastItem } from './types';

const { Fill: __unstableBlockToolbarLastItem, Slot } = createSlotFill(
	'__unstableBlockToolbarLastItem'
);

// The fill carries its slot as a static.
( __unstableBlockToolbarLastItem as BlockToolbarLastItem ).Slot = Slot;

export default __unstableBlockToolbarLastItem as BlockToolbarLastItem;
