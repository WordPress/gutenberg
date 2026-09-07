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

// Crop geometry
export {
	applyCropEdit,
	clampCropPixelRectToBounds,
	cropPixelRectToNormalizedRect,
	getCropPixelRect,
	validateCropPixelRectAgainstBounds,
} from './crop-geometry';
export type {
	CropEditField,
	CropPixelRect,
	CropPixelRectBounds,
	CropPixelRectCheck,
	CropPixelRectInput,
	CropPixelRectViolation,
} from './crop-geometry';

// Fine rotation policy
export { fineRotation } from './fine-rotation';

// Pipeline
export {
	applyOperationToState,
	stateFromPipeline,
} from './transforms/pipeline';

// Export / canvas
export { exportCroppedImage, applyToCanvas } from './export/canvas-renderer';
