/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { DotTip } from '@wordpress/nux';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
	NavigableToolbar,
	BlockNavigationDropdown,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import FullscreenModeClose from '../fullscreen-mode-close';

function HeaderToolbar( { hasFixedToolbar, isLargeViewport, showInserter } ) {
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
			<FullscreenModeClose />
			<div>
				<Inserter disabled={ ! showInserter } position="bottom right" />
				<DotTip tipId="core/editor.inserter">
					{ __( 'Welcome to the wonderful world of blocks! Click the “+” (“Add block”) button to add a new block. There are blocks available for all kinds of content: you can insert text, headings, images, lists, and lots more!' ) }
				</DotTip>
			</div>
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<TableOfContents />
			<BlockNavigationDropdown />
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
		showInserter: select( 'core/edit-post' ).getEditorMode() === 'visual' && select( 'core/editor' ).getEditorSettings().richEditingEnabled,
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( HeaderToolbar );
