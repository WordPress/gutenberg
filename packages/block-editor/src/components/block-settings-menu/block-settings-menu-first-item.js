/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/slot-fill';

const { Fill: __experimentalBlockSettingsMenuFirstItem, Slot } = createSlotFill(
	'__experimentalBlockSettingsMenuFirstItem'
);

__experimentalBlockSettingsMenuFirstItem.Slot = Slot;

export default __experimentalBlockSettingsMenuFirstItem;
