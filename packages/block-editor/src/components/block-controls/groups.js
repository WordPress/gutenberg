import { createSlotFill } from '@wordpress/components';

const BlockControlsDefault = createSlotFill( 'BlockControls' );
const BlockControlsBlock = createSlotFill( 'BlockControlsBlock' );
const BlockControlsInline = createSlotFill( 'BlockFormatControls' );
const BlockControlsOther = createSlotFill( 'BlockControlsOther' );
const BlockControlsParent = createSlotFill( 'BlockControlsParent' );
const BlockControlsStyleStates = createSlotFill( 'BlockControlsStyleStates' );

const groups = {
	default: BlockControlsDefault,
	block: BlockControlsBlock,
	inline: BlockControlsInline,
	other: BlockControlsOther,
	parent: BlockControlsParent,
	'style-states': BlockControlsStyleStates,
};

export default groups;
