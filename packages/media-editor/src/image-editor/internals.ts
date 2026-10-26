/**
 * For the media editor's own state code, which drives the cropper through
 * its reducer. Everything else imports from `./index`.
 */
export {
	DEFAULT_STATE,
	cropperReducer,
	enforceContainment,
	areCropperStatesEqual,
	applyOperationToState,
	computeInscribedRect,
} from './core';
export type { CropperAction } from './core';
export { buildCropperSetters } from './react/hooks';
export type { CropperSetters } from './react/hooks';
