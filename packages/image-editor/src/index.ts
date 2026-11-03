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

// The steps that make the original image match the edit, for saving it.
export { getStepsForOriginal } from './get-steps-for-original';
export type { OriginalImageStep } from './get-steps-for-original';
