/**
 * The image editor's main file. Inside the package, import the image editor
 * from here.
 *
 * Keep the list of exports below explicit, so the internals of `core/`,
 * `react/hooks/`, and `react/components/` do not get shared by accident. The
 * media editor's own state code imports its state helpers from `./core` and
 * `./react/hooks` directly, as the package's components already do.
 *
 * Outside the package, only a small part of this module is available,
 * through the package's private API (see `../private-apis.ts`).
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
