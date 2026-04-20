// Types
export type {
	CropperState,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Flip,
	StencilProps,
} from './types';
// Note: `CropperAction` is intentionally not exported. The reducer's
// action shape is an internal detail; consumers drive state through
// the named setters on `UseCropperStateReturn` (setPan, setZoom, etc.).
// This keeps the public API stable as the reducer evolves.

// Constants
export {
	DEFAULT_STATE,
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
} from './constants';
export type { AspectRatioPreset } from './constants';

// Source region (pixel and percentage)
export { getSourceRegion, getSourceRegionPercent } from './source-region';
export type { SourceRegion, SourceRegionPercent } from './source-region';

// Pipeline
export {
	applyOperationToState,
	stateFromPipeline,
} from './transforms/pipeline';

// Export / canvas
export { exportCroppedImage, applyToCanvas } from './export/canvas-renderer';
