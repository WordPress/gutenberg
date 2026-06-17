/**
 * Public image editor contract.
 *
 * Keep this barrel explicit so implementation details from `core/`,
 * `react/hooks/`, or `react/components/` do not become supported API by
 * accident. Internal modules may export additional helpers for local tests or
 * React wiring; consumers should import through this file.
 */

// React surface.
export { useCropperReducer, buildCropperSetters } from './react/hooks';
export { Cropper, CropperProvider, useCropper } from './react/components';
export type { CropperController, CropperSetters } from './react/hooks';
export type { CropperProps } from './react/components';

// State and extension types.
export type {
	CropperState,
	CropperAction,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Flip,
	StencilProps,
	HandlePosition,
} from './core';

// Deterministic cropper helpers. The reducer + containment + state
// equality helpers are exported so consumers can build composite
// stores that delegate cropper actions (see `useMediaEditorState` for
// the media editor's composite store).
export {
	DEFAULT_STATE,
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	computeInscribedRect,
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
