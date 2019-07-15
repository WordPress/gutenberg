/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	NavigableToolbar,
	BlockNavigationDropdown,
} from '@wordpress/block-editor';
import {
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
} from '@wordpress/editor';

function HeaderToolbar( { hasFixedToolbar, isLargeViewport, showInserter, isTextModeEnabled } ) {
	const toolbarAriaLabel = hasFixedToolbar ?
		/* translators: accessibility text for the editor toolbar when Top Toolbar is on */
		__( 'Document and block tools' ) :
		/* translators: accessibility text for the editor toolbar when Top Toolbar is off */
		__( 'Document tools' );

	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ toolbarAriaLabel }
		>
			<Inserter disabled={ ! showInserter } position="bottom right" />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<TableOfContents hasOutlineItemsDisabled={ isTextModeEnabled } />
			<BlockNavigationDropdown isDisabled={ isTextModeEnabled } />
			{ hasFixedToolbar && isLargeViewport && (
				<div className="edit-post-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
		// This setting (richEditingEnabled) should not live in the block editor's setting.
		showInserter: select( 'core/edit-post' ).getEditorMode() === 'visual' && select( 'core/editor' ).getEditorSettings().richEditingEnabled,
		isTextModeEnabled: select( 'core/edit-post' ).getEditorMode() === 'text',
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( HeaderToolbar );
