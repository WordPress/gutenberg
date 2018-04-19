/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	EditorHistoryRedo,
	EditorHistoryUndo,
	MultiBlocksSwitcher,
	NavigableToolbar,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';

function HeaderToolbar( { hasFixedToolbar, isLargeViewport } ) {
	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ __( 'Editor Toolbar' ) }
		>
			<Inserter position="bottom right" />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<MultiBlocksSwitcher />
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
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( HeaderToolbar );
