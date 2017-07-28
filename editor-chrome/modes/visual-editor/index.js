/**
 * WordPress Dependencies
 */
import { VisualEditor, FullInserter } from 'editor';
import { __ } from 'i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostTitle from '../../post-title';

function VisualEditorWrapper() {
	return (
		<div
			role="region"
			aria-label={ __( 'Visual Editor' ) }
			className="editor-chrome-visual-editor"
		>
			<PostTitle />
			<VisualEditor />
			<FullInserter />
		</div>
	);
}

export default VisualEditorWrapper;
