/**
 * The cropper. Export only what a consumer imports, so files in `core/`
 * and `react/` do not become supported API by accident.
 */

// The cropper and its controller. Keep the state yourself
// (`useCropperController( { state, onChange } )`) to put it in your own
// undo history.
export { Cropper } from './react/components';
export { useCropperController, createCropperState } from './react/hooks';
export type { CropperController } from './react/hooks';
export type { CropperState } from './core';
export { areCropperStatesEqual } from './core';

// Limits for building your own zoom and rotation controls.
export { MAX_ZOOM, MAX_ROTATION_OFFSET } from './core/constants';
export { getMinZoom } from './core/containment';

// The rotate, flip and crop instructions the WordPress media REST endpoint
// expects.
export { buildModifiers } from './build-modifiers';
export type { Modifier } from './build-modifiers';
