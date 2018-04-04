/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	ObserveTyping,
	EditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
} from '@wordpress/editor';
import { Fragment, compose, Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.renderBlockMenu = this.renderBlockMenu.bind( this );
	}

	renderBlockMenu( { children, onClose } ) {
		return (
			<Fragment>
				<BlockInspectorButton onClick={ onClose } />
				{ children }
			</Fragment>
		);
	}

	render() {
		const { hasFixedToolbar, isLargeViewport } = this.props;
		return (
			<BlockSelectionClearer className="edit-post-visual-editor">
				<EditorGlobalKeyboardShortcuts />
				<CopyHandler />
				<MultiSelectScrollIntoView />
				<WritingFlow>
					<ObserveTyping>
						<PostTitle />
						<BlockList
							showContextualToolbar={ ! isLargeViewport || ! hasFixedToolbar }
							renderBlockMenu={ this.renderBlockMenu }
						/>
					</ObserveTyping>
				</WritingFlow>
			</BlockSelectionClearer>
		);
	}
}

export default compose( [
	withSelect( ( select ) => ( {
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( VisualEditor );
