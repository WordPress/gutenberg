/**
 * Public image editor contract.
 *
 * Keep this barrel explicit so implementation details from `core/`,
 * `react/hooks/`, or `react/components/` do not become supported API by
 * accident. The media editor's own state code imports the reducer-level
 * helpers from `./core` and `./react/hooks` directly, as the package's
 * components already do; everyone else uses what is here.
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
