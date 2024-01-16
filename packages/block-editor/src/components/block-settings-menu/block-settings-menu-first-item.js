/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

// TODO: forward dropdown menu context

const { Fill: __unstableBlockSettingsMenuFirstItem, Slot } = createSlotFill(
	'__unstableBlockSettingsMenuFirstItem'
);

__unstableBlockSettingsMenuFirstItem.Slot = Slot;

export default __unstableBlockSettingsMenuFirstItem;
