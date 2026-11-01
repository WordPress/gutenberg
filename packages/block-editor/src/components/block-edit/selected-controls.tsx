import { createSlotFill } from '@wordpress/components';

// Controls for the selected block from outside the block editor, rendered next
// to the block rather than through an `editor.BlockEdit` filter around every
// block. The slot renders them in the block's place, with its edit props.
const { Fill, Slot } = createSlotFill( Symbol( 'SelectedBlockEditControls' ) );

export {
	Fill as SelectedBlockEditControls,
	Slot as SelectedBlockEditControlsSlot,
};
