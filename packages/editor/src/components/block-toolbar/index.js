/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';

function BlockToolbar( { blockClientIds, isValid, mode } ) {
	if ( blockClientIds.length > 1 ) {
		return (
			<div className="editor-block-toolbar">
				<MultiBlocksSwitcher />
			</div>
		);
	}

	if ( ! isValid || 'visual' !== mode ) {
		return null;
	}

	return (
		<div className="editor-block-toolbar">
			<BlockSwitcher clientIds={ blockClientIds } />
			<BlockControls.Slot />
			<BlockFormatControls.Slot />
		</div>
	);
}

export default withSelect( ( select ) => {
	const {
		getSelectedBlock,
		getBlockMode,
		getMultiSelectedBlockClientIds,
	} = select( 'core/editor' );
	const block = getSelectedBlock();
	const blockClientIds = block ?
		[ block.clientId ] :
		getMultiSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: block ? block.isValid : null,
		mode: block ? getBlockMode( block.clientId ) : null,
	};
} )( BlockToolbar );
