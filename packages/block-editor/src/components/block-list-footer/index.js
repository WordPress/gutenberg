/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalBlockListFooter, Slot } = createSlotFill(
	'__experimentalBlockListFooter'
);

__experimentalBlockListFooter.Slot = Slot;

export default __experimentalBlockListFooter;
