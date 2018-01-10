/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import { BlockList, PostTitle, WritingFlow, DefaultBlockAppender, EditorGlobalKeyboardShortcuts } from '../../../components';
import VisualEditorInserter from './inserter';
import { hasFixedToolbar } from '../../../store/selectors';
import { clearSelectedBlock } from '../../../store/actions';

function VisualEditor( { showContextualToolbar } ) {
	return (
		<div className="editor-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<WritingFlow>
				<PostTitle />
				<BlockList
					showContextualToolbar={ showContextualToolbar } />
				<DefaultBlockAppender />
			</WritingFlow>
			<VisualEditorInserter />
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			showContextualToolbar: ! hasFixedToolbar( state ),
		};
	},
	{
		clearSelectedBlock,
	}
)( VisualEditor );
