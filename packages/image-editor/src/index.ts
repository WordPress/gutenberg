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
export type { ImageEditorController, ImageEditorOptions } from './react/hooks';
export type {
	Flip,
	ImageEditorState,
	NormalizedPoint,
	NormalizedRect,
	Size,
} from './core/types';
export { areImageEditorStatesEqual } from './core/state';

// Map the edit onto the original image, for saving it.
export { mapEditToOriginal } from './map-edit-to-original';
export type { OriginalImageEdit } from './map-edit-to-original';
