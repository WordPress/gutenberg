/**
 * The image editor. Export only what a consumer imports, so files in
 * `core/` and `react/` do not become supported API by accident.
 */

// The canvas, its controller and the state. The consumer keeps the state
// (`useImageEditor( { state, onChange } )`), for example in its own undo
// history.
export {
	ImageEditorCanvas,
	useImageEditor,
	createImageEditorState,
	areImageEditorStatesEqual,
} from './image-editor';
export type {
	ImageEditorCanvasProps,
	ImageEditorController,
	ImageEditorOptions,
	ImageEditorState,
} from './image-editor';

// The steps that make the original image match the edit, for saving it.
export { mapEditToOriginal } from './map-edit-to-original';
export type { OriginalImageEdit } from './map-edit-to-original';
