/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	EditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';
import { hasFixedToolbar } from '../../../store/selectors';

function VisualEditor( props ) {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<PostTitle />
				<BlockList
					showContextualToolbar={ ! props.hasFixedToolbar }
					renderBlockMenu={ ( { children, onClose } ) => (
						<Fragment>
							<BlockInspectorButton onClick={ onClose } />
							{ children }
						</Fragment>
					) }
				/>
			</WritingFlow>
		</BlockSelectionClearer>
	);
}

export default connect(
	( state ) => {
		return {
			hasFixedToolbar: hasFixedToolbar( state ),
		};
	},
	undefined,
	undefined,
	{ storeKey: 'edit-post' }
)( VisualEditor );
