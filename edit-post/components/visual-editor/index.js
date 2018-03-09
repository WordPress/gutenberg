/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	EditorGlobalKeyboardShortcuts,
	MultiSelectScrollIntoView,
} from '@wordpress/editor';
import { Fragment, compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';

function VisualEditor( { hasFixedToolbar, isLargeViewport } ) {
	return (
		<WritingFlow className="edit-post-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<PostTitle />
			<BlockList
				showContextualToolbar={ ! isLargeViewport || ! hasFixedToolbar }
				renderBlockMenu={ ( { children, onClose } ) => (
					<Fragment>
						<BlockInspectorButton onClick={ onClose } />
						{ children }
					</Fragment>
				) }
			/>
		</WritingFlow>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( VisualEditor );
