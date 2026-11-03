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
export type { CropperControllerState } from './core';
export { areCropperStatesEqual } from './core';

// Aspect-ratio presets.
export { DEFAULT_ASPECT_RATIOS } from './presets/aspect-ratio-presets';
export { resolveAspectRatio } from './presets/resolve-aspect-ratio';
export type { AspectRatioPreset } from './core';

// Limits for building your own zoom and rotation controls.
export { MAX_ZOOM, MAX_ROTATION_OFFSET } from './core/constants';
export { getMinZoom } from './core/containment';

// The rotate, flip and crop instructions the WordPress media REST endpoint
// expects.
export { buildModifiers } from './build-modifiers';
export type { Modifier } from './build-modifiers';

// Deprecated: the `react-easy-crop` based cropper. Everything it needs lives
// in `./legacy`, so removing that folder and these exports removes it.
export { default as ImageCropper } from './legacy/components/image-cropper';
export {
	useImageCropper,
	default as ImageCropperProvider,
} from './legacy/provider';
export type {
	Point,
	Area,
	MediaSize,
	Flip,
	ImageCropperState,
	CropperState,
	ImageCropperProps,
	ImageCropperContextValue,
} from './legacy/types';
export { normalizeRotation } from './legacy/utils';
