// Types
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
} from './types';

// Constants
export {
	DEFAULT_STATE,
	DEFAULT_ASPECT_RATIOS,
	ORIGINAL_ASPECT_RATIO,
} from './constants';
export type { AspectRatioPreset } from './constants';

// Reducer + state helpers. `CropperAction` and `cropperReducer` are
// exported so composite stores can delegate cropper actions through the
// pure reducer (see `useMediaEditorState`). Most consumers should
// instead drive state through the named setters on `CropperController`.
export {
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	isStateDirty,
} from './state';

// Source region (pixel and percentage)
export { getSourceRegion, getSourceRegionPercent } from './source-region';
export type { SourceRegion, SourceRegionPercent } from './source-region';

// Crop-rect helpers
export { computeInscribedRect } from './crop-rect';

// Pipeline
export {
	applyOperationToState,
	stateFromPipeline,
} from './transforms/pipeline';

// Export / canvas
export { exportCroppedImage, applyToCanvas } from './export/canvas-renderer';
