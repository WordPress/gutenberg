/**
 * WordPress Dependencies
 */
import { BlockControls, BlockFormatControls } from '@wordpress/blocks';
import { withSelect } from '@wordpress/data';
import { Toolbar } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSelectParent from '../block-select-parent';

function BlockToolbar( { block, mode } ) {
	if ( ! block || ! block.isValid || mode !== 'visual' ) {
		return null;
	}

	return (
		<div className="editor-block-toolbar">
			<Toolbar><BlockSelectParent uid={ block.uid } /></Toolbar>
			<BlockControls.Slot />
			<BlockFormatControls.Slot />
		</div>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlock, getBlockMode } = select( 'core/editor' );
	const block = getSelectedBlock();

	return {
		block,
		mode: block ? getBlockMode( block.uid ) : null,
	};
} )( BlockToolbar );
