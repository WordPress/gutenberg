/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: _BlockControlsLastItem, Slot } = createSlotFill( '_BlockControlsLastItem' );

_BlockControlsLastItem.Slot = Slot;

export default _BlockControlsLastItem;
