/**
 * Internal dependencies
 */
import EditorCanvas from './editor-canvas';
import EditorCanvasContainer from '../editor-canvas-container';
import useSiteEditorSettings from './use-site-editor-settings';

export default function SiteEditorCanvas() {
	const settings = useSiteEditorSettings();

	return (
		<EditorCanvasContainer.Slot>
			{ ( [ editorCanvasView ] ) =>
				editorCanvasView ? (
					<div className="edit-site-visual-editor">
						{ editorCanvasView }
					</div>
				) : (
					<EditorCanvas settings={ settings } />
				)
			}
		</EditorCanvasContainer.Slot>
	);
}
