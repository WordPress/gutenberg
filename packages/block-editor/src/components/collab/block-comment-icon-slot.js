/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __unstableCommentIconFill, Slot } = createSlotFill(
	'__unstableCommentIconFill'
);

__unstableCommentIconFill.Slot = Slot;

export default __unstableCommentIconFill;
