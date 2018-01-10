/**
 * Internal dependencies
 */
import './style.scss';
import { PostTextEditor, PostTextEditorToolbar, PostTitle } from '../../../components';

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
