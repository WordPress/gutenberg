/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );

const BlockControlsDefault = createPrivateSlotFill( 'BlockControls' );
const BlockControlsBlock = createPrivateSlotFill( 'BlockControlsBlock' );
const BlockControlsInline = createPrivateSlotFill( 'BlockFormatControls' );
const BlockControlsOther = createPrivateSlotFill( 'BlockControlsOther' );
const BlockControlsParent = createPrivateSlotFill( 'BlockControlsParent' );

const groups = {
	default: BlockControlsDefault,
	block: BlockControlsBlock,
	inline: BlockControlsInline,
	other: BlockControlsOther,
	parent: BlockControlsParent,
};

export default groups;
