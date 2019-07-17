/**
 * WordPress dependencies
 */
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import VisualEditorInserter from '../inserter';

function BlockMobileToolbar( { clientId, horizontalMover } ) {
	return (
		<div className="editor-block-list__block-mobile-toolbar block-editor-block-list__block-mobile-toolbar">
			<VisualEditorInserter />
			<BlockMover clientIds={ [ clientId ] } horizontalMover={ horizontalMover } />
		</div>
	);
}

export default ifViewportMatches( '< small' )( BlockMobileToolbar );
