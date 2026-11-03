// Types
export type {
	InternalImageEditorState,
	ImageEditorAction,
	TransformOperation,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Flip,
	StencilProps,
	HandlePosition,
} from './types';

// Constants
export { DEFAULT_STATE } from './constants';

// Reducer + state helpers. `ImageEditorAction` and `imageEditorReducer` are
// exported so composite stores can delegate editor actions through the
// pure reducer (see `useMediaEditorState`). Most consumers should
// instead drive state through the named setters on `InternalImageEditorController`.
export {
	imageEditorReducer,
	enforceContainment,
	areImageEditorStatesEqual,
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
