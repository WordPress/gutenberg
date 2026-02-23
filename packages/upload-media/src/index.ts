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
} from './feature-detection';

export { shouldEnableClientSideMediaProcessing } from './utils';

export type { ImageFormat } from './store/types';
export type { FeatureDetectionResult } from './feature-detection';
