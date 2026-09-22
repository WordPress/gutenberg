import { store as uploadStore } from './store';

export { uploadStore as store };

export { default as MediaUploadProvider } from './components/provider';
export { ErrorCode, UploadError } from './upload-error';
export { getErrorMessage } from './error-messages';
export {
	getHeicConversionAdvice,
	getHeicUnsupportedMessage,
} from './heic-support';
export {
	detectClientSideMediaSupport,
	isClientSideMediaSupported,
	isHeicCanvasSupported,
	clearFeatureDetectionCache,
} from './feature-detection';
export {
	registerUploadOperation,
	unregisterUploadOperation,
	getUploadOperation,
	getUploadOperations,
	registerUploadConcurrencyPool,
} from './upload-operations';
export { OperationType as UploadOperationType } from './store/types';

export type { ImageFormat } from './store/types';
export type {
	UploadOperationSettings,
	UploadConcurrencyPoolSettings,
} from './upload-operations';
export type {
	OperationDefinition as UploadOperation,
	OperationName as UploadOperationName,
	Operation as UploadOperationStep,
	OperationItem as UploadOperationItem,
	OperationContext as UploadOperationContext,
	OperationSideloadArgs as UploadOperationSideloadArgs,
	OperationResult as UploadOperationResult,
	OperationPlacement as UploadOperationPlacement,
	OperationPlanContext as UploadOperationPlanContext,
	OperationPlanResult as UploadOperationPlanResult,
	ConcurrencyPoolDefinition as UploadConcurrencyPool,
} from './store/types';
export type { FeatureDetectionResult } from './feature-detection';
export type { ErrorMessageConfig } from './error-messages';
