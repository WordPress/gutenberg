import { createSlotFill } from '@wordpress/components';
import type { SlotFill } from '../inspector-controls/types';

const BlockControlsDefault = createSlotFill( 'BlockControls' );
const BlockControlsBlock = createSlotFill( 'BlockControlsBlock' );
const BlockControlsInline = createSlotFill( 'BlockFormatControls' );
const BlockControlsOther = createSlotFill( 'BlockControlsOther' );
const BlockControlsParent = createSlotFill( 'BlockControlsParent' );
const BlockControlsStyleState = createSlotFill( 'BlockControlsStyleState' );

const groups: Record< string, SlotFill > = {
	default: BlockControlsDefault,
	block: BlockControlsBlock,
	inline: BlockControlsInline,
	other: BlockControlsOther,
	parent: BlockControlsParent,
	'style-state': BlockControlsStyleState,
};

export default groups;
