/**
 * The image editor's exports. Keep this list explicit so files in
 * `core/` and `react/` do not become supported API by accident.
 */

// React surface.
export { useCropperController } from './react/hooks';
export { Cropper, CropperProvider, useCropper } from './react/components';
export type { CropperController } from './react/hooks';
export type { CropperProps } from './react/components';

// State and extension types.
export type {
	CropperState,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Flip,
	StencilProps,
	HandlePosition,
} from './core';

// Deterministic helpers: where the crop lands in the source, the
// replayable operation list, and export without a controller.
export {
	ORIGINAL_ASPECT_RATIO,
	getSourceRegion,
	getSourceRegionPercent,
	stateFromPipeline,
	exportCroppedImage,
	applyToCanvas,
} from './core';
export type {
	AspectRatioPreset,
	SourceRegion,
	SourceRegionPercent,
} from './core';

// Aspect-ratio presets, and limits for building zoom and rotation controls.
export { DEFAULT_ASPECT_RATIOS } from './presets/aspect-ratio-presets';
export { MAX_ZOOM, MAX_ROTATION_OFFSET } from './core/constants';
export { getMinZoom } from './core/containment';

// The rotate, flip and crop instructions the WordPress media REST endpoint
// expects.
export { buildModifiers } from './build-modifiers';
export type { Modifier } from './build-modifiers';

// Used by the media editor's state code.
export {
	DEFAULT_STATE,
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	computeInscribedRect,
} from './core';
export type { CropperAction } from './core';
export { buildCropperSetters } from './react/hooks';
