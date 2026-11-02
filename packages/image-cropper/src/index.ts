/**
 * The cropper. Keep this list explicit so files in `core/` and `react/` do
 * not become supported API by accident.
 */

// React components and hooks.
export { useCropperController } from './react/hooks';
export { Cropper, CropperProvider, useCropper } from './react/components';
export type { CropperController } from './react/hooks';
export type { CropperProps } from './react/components';

// State and extension types.
export type {
	CropGeometry,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Flip,
	StencilProps,
	HandlePosition,
} from './core';

// Where the crop lands in the source image, and export in the browser.
export {
	ORIGINAL_ASPECT_RATIO,
	getSourceRegion,
	getSourceRegionPercent,
	exportCroppedImage,
} from './core';
export type {
	AspectRatioPreset,
	SourceRegion,
	SourceRegionPercent,
} from './core';
export { DEFAULT_ASPECT_RATIOS } from './state/aspect-ratio-presets';

// Limits for building your own zoom and rotation controls.
export { MAX_ZOOM, MAX_ROTATION_OFFSET } from './core/constants';
export { getMinZoom } from './core/containment';

// The rotate, flip and crop instructions the WordPress media REST endpoint
// expects.
export { buildModifiers } from './build-modifiers';
export type { Modifier } from './build-modifiers';

// Used by the media editor's state code until it moves into this package.
export {
	DEFAULT_STATE,
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	computeInscribedRect,
} from './core';
export type { CropperAction } from './core';
export { buildCropperSetters } from './react/hooks';

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
	ImageCropperState,
	CropperState,
	ImageCropperProps,
	ImageCropperContextValue,
} from './legacy/types';
export { normalizeRotation } from './legacy/utils';
