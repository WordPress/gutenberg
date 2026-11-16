import { createSlotFill } from '@wordpress/components';
import type { BlockSettingsMenuFirstItem } from './types';

const { Fill: __unstableBlockSettingsMenuFirstItem, Slot } = createSlotFill(
	'__unstableBlockSettingsMenuFirstItem'
);

// The fill carries its slot as a static.
( __unstableBlockSettingsMenuFirstItem as BlockSettingsMenuFirstItem ).Slot =
	Slot;

export default __unstableBlockSettingsMenuFirstItem as BlockSettingsMenuFirstItem;
