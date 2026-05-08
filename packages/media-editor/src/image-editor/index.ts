/**
 * Public image editor contract.
 *
 * Keep this barrel explicit so implementation details from `core/`,
 * `react/hooks/`, or `react/components/` do not become supported API by
 * accident. Internal modules may export additional helpers for local tests or
 * React wiring; consumers should import through this file.
 */

// React surface.
export { useCropperState } from './react/hooks';
export { Cropper, CropperProvider, useCropper } from './react/components';
export type { UseCropperStateReturn } from './react/hooks';
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
} from './core';

// Deterministic cropper helpers.
export {
	DEFAULT_STATE,
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
	getSourceRegion,
	getSourceRegionPercent,
	applyOperationToState,
	stateFromPipeline,
	exportCroppedImage,
	applyToCanvas,
} from './core';
export type {
	AspectRatioPreset,
	SourceRegion,
	SourceRegionPercent,
} from './core';
