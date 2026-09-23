import { createSlotFill } from '@wordpress/components';

const BlockControlsDefault = createSlotFill( 'BlockControls' );
const BlockControlsBlock = createSlotFill( 'BlockControlsBlock' );
const BlockControlsInline = createSlotFill( 'BlockFormatControls' );
const BlockControlsOther = createSlotFill( 'BlockControlsOther' );
const BlockControlsParent = createSlotFill( 'BlockControlsParent' );
const BlockControlsStyleState = createSlotFill( 'BlockControlsStyleState' );
const BlockControlsViewport = createSlotFill( 'BlockControlsViewport' );

const groups = {
	default: BlockControlsDefault,
	block: BlockControlsBlock,
	inline: BlockControlsInline,
	other: BlockControlsOther,
	parent: BlockControlsParent,
	'style-state': BlockControlsStyleState,
	viewport: BlockControlsViewport,
};

export default groups;
