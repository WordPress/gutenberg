/**
 * The image editor. Export only what a consumer imports, so files in
 * `core/` and `react/` do not become supported API by accident.
 */

// The canvas, its controller and the state. The consumer keeps the state
// (`useImageEditor( { state, onChange } )`), for example in its own undo
// history.
export { ImageEditorCanvas } from './react/components';
export type { ImageEditorCanvasProps } from './react/components';
export { useImageEditor, createImageEditorState } from './react/hooks';
export type {
	CreateImageEditorStateOptions,
	ImageEditorController,
	ImageEditorOptions,
} from './react/hooks';
export type {
	Flip,
	ImageEditorState,
	NormalizedPoint,
	NormalizedRect,
	Size,
} from './core/types';
export { areImageEditorStatesEqual } from './core/state';

// The size of the image the edit produces.
export { getOutputSize } from './get-output-size';

// Map the edit onto the original image, for saving it.
export { getImageEdits } from './get-image-edits';
export type { ImageEdit } from './get-image-edits';

// Export the edited image as a file, in the browser.
export { exportImage } from './export-image';
export type { ExportImageOptions } from './export-image';
