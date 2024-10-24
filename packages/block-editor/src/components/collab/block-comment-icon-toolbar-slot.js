/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __unstableCommentIconToolbarFill, Slot } = createSlotFill(
	'__unstableCommentIconToolbarFill'
);

__unstableCommentIconToolbarFill.Slot = Slot;

export default __unstableCommentIconToolbarFill;
