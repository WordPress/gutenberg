/**
 * Internal dependencies
 */
import { store as uploadStore } from './store';

export { uploadStore as store };

export { default as MediaUploadProvider } from './components/provider';
export { ErrorCode, UploadError } from './upload-error';
export { getErrorMessage } from './error-messages';
export {
	detectClientSideMediaSupport,
	isClientSideMediaSupported,
	isHeicCanvasSupported,
	clearFeatureDetectionCache,
} from './feature-detection';

export type { ImageFormat } from './store/types';
export type { FeatureDetectionResult } from './feature-detection';
export type { ErrorMessageConfig } from './error-messages';
