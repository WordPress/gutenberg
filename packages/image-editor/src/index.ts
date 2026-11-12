/**
 * The image editor. Export only what a consumer imports, so files in
 * `core/` and `react/` do not become supported API by accident.
 */

// The canvas, its controller and the state.
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

// The edit, described against the loaded image, and the size it produces.
export { getOutputSize } from './get-output-size';
export { getImageEdit } from './get-image-edit';
export type { ImageEdit } from './get-image-edit';

// Export the edited image as a file, in the browser.
export { exportImage } from './export-image';
export type { ExportImageOptions } from './export-image';
