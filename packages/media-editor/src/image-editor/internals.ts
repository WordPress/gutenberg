/**
 * The cropper's internals, for a composite store that delegates cropper
 * actions through the pure reducer, the way the media editor's session
 * does. Not part of the consumer contract: a consumer drives the cropper
 * through the controller and the helpers in `./index`.
 */
export {
	DEFAULT_STATE,
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	isStateDirty,
	applyOperationToState,
	computeInscribedRect,
} from './core';
export type { CropperAction } from './core';
export { buildCropperSetters } from './react/hooks';
export type { CropperSetters } from './react/hooks';
