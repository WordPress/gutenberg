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

function VisualEditor( { hasFixedToolbar } ) {
	return (
		<div className="editor-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<WritingFlow>
				<PostTitle />
				<BlockList showContextualToolbar={ ! hasFixedToolbar } />
				<DefaultBlockAppender />
			</WritingFlow>
			<VisualEditorInserter />
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			hasFixedToolbar: hasFixedToolbar( state ),
		};
	},
	{
		clearSelectedBlock,
	}
)( VisualEditor );
