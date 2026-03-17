/**
 * Internal dependencies
 */
import { store as uploadStore } from './store';

export { uploadStore as store };

export { default as MediaUploadProvider } from './components/provider';
export { UploadError } from './upload-error';
export {
	detectClientSideMediaSupport,
	isClientSideMediaSupported,
	clearFeatureDetectionCache,
} from './feature-detection';

export type { ImageFormat } from './store/types';
export type { FeatureDetectionResult } from './feature-detection';
