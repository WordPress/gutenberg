/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalBlockSettingsMenuFirstItem, Slot } = createSlotFill( '__experimentalBlockSettingsMenuFirstItem' );

__experimentalBlockSettingsMenuFirstItem.Slot = Slot;

export default __experimentalBlockSettingsMenuFirstItem;
