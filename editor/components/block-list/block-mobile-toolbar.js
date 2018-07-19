/**
 * WordPress dependencies
 */
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSettingsMenu from '../block-settings-menu';
import VisualEditorInserter from '../inserter';

function BlockMobileToolbar( { rootClientId, clientId } ) {
	return (
		<div className="editor-block-list__block-mobile-toolbar">
			<VisualEditorInserter />
			<BlockMover clientIds={ [ clientId ] } />
			<BlockSettingsMenu rootClientId={ rootClientId } clientIds={ [ clientId ] } />
		</div>
	);
}

export default ifViewportMatches( '< small' )( BlockMobileToolbar );
