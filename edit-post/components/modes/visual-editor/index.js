/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import {
	BlockList,
	PostTitle,
	WritingFlow,
	DefaultBlockAppender,
	EditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	InserterWithShortcuts,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';
import { hasFixedToolbar } from '../../../store/selectors';

function VisualEditor( props ) {
	return (
		<BlockSelectionClearer className="editor-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<WritingFlow>
				<PostTitle />
				<BlockList
					showContextualToolbar={ ! props.hasFixedToolbar }
					renderBlockMenu={ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
				/>
				<DefaultBlockAppender />
			</WritingFlow>
			<InserterWithShortcuts />
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
