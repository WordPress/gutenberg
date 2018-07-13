/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';

function BlockToolbar( { block, mode, selectedBlockUIDs } ) {
	if ( selectedBlockUIDs.length < 2 && ( ! block || ! block.isValid || 'visual' !== mode ) ) {
		return null;
	}

	return (
		<div className="editor-block-toolbar">
			<BlockSwitcher uids={ selectedBlockUIDs.length > 1 ? selectedBlockUIDs : [ block.uid ] } />
			<BlockControls.Slot />
			<BlockFormatControls.Slot />
		</div>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlock, getBlockMode, getMultiSelectedBlockUids } = select( 'core/editor' );
	const block = getSelectedBlock();
	const selectedBlockUIDs = getMultiSelectedBlockUids();

	return {
		block,
		mode: block ? getBlockMode( block.uid ) : null,
		selectedBlockUIDs,
	};
} )( BlockToolbar );
