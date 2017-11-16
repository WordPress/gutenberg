/**
 * Internal dependencies
 */
import './style.scss';
import { PostTextEditor, PostTextEditorToolbar } from '../../components';
import PostTitle from '../../post-title';

function TextEditor() {
	return (
		<div className="editor-text-editor">
			<div className="editor-text-editor__formatting">
				<PostTextEditorToolbar />
			</div>
			<div className="editor-text-editor__body">
				<PostTitle />
				<PostTextEditor />
			</div>
		</div>
	);
}

export default TextEditor;
