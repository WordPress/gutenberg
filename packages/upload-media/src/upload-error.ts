/**
 * Error codes for upload operations.
 *
 * These codes categorize different types of failures that can occur
 * during the upload process, allowing for appropriate retry strategies
 * and user-friendly error messages.
 */
export enum ErrorCode {
	// Retryable network errors
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT_ERROR = 'TIMEOUT_ERROR',
	SERVER_ERROR = 'SERVER_ERROR',

	// Non-retryable validation errors
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	NOT_FOUND = 'NOT_FOUND',
	FILE_TOO_LARGE = 'FILE_TOO_LARGE',
	INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
	INVALID_IMAGE_DIMENSIONS = 'INVALID_IMAGE_DIMENSIONS',

	// Processing errors (some may be retryable)
	IMAGE_TRANSCODING_ERROR = 'IMAGE_TRANSCODING_ERROR',
	IMAGE_ROTATION_ERROR = 'IMAGE_ROTATION_ERROR',
	VIPS_WORKER_ERROR = 'VIPS_WORKER_ERROR',
	MEMORY_ERROR = 'MEMORY_ERROR',

	// User actions
	ABORTED = 'ABORTED',

	// Catch-all
	GENERAL = 'GENERAL',
}

/**
 * Error codes that are safe to retry automatically.
 */
const RETRYABLE_CODES: ErrorCode[] = [
	ErrorCode.NETWORK_ERROR,
	ErrorCode.TIMEOUT_ERROR,
	ErrorCode.SERVER_ERROR,
	ErrorCode.VIPS_WORKER_ERROR,
];

interface UploadErrorArgs {
	code: string;
	message: string;
	file: File;
	cause?: Error;
}

/**
 * MediaError class.
 *
 * Small wrapper around the `Error` class
 * to hold an error code and a reference to a file object.
 */
export class UploadError extends Error {
	code: string;
	file: File;

	constructor( { code, message, file, cause }: UploadErrorArgs ) {
		super( message, { cause } );

		Object.setPrototypeOf( this, new.target.prototype );

		this.code = code;
		this.file = file;
	}

	/**
	 * Determines if this error is safe to retry automatically.
	 *
	 * Retryable errors are typically transient issues like network
	 * failures or server errors that may resolve on a subsequent attempt.
	 *
	 * @return Whether the error can be retried.
	 */
	get isRetryable(): boolean {
		return RETRYABLE_CODES.includes( this.code as ErrorCode );
	}
}
