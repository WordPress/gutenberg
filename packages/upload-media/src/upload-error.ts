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
	SERVER_ERROR = 'SERVER_ERROR', // 5xx responses

	// Non-retryable client errors
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	PERMISSION_DENIED = 'PERMISSION_DENIED', // 403
	NOT_FOUND = 'NOT_FOUND', // 404
	FILE_TOO_LARGE = 'FILE_TOO_LARGE',
	INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
	INVALID_IMAGE_DIMENSIONS = 'INVALID_IMAGE_DIMENSIONS', // Sideload dimension mismatch

	// Processing errors (conditionally retryable)
	IMAGE_TRANSCODING_ERROR = 'IMAGE_TRANSCODING_ERROR',
	IMAGE_ROTATION_ERROR = 'IMAGE_ROTATION_ERROR',
	VIPS_WORKER_ERROR = 'VIPS_WORKER_ERROR',
	MEMORY_ERROR = 'MEMORY_ERROR',

	// User action
	ABORTED = 'ABORTED',

	// Generic
	GENERAL = 'GENERAL',
}

/**
 * Error codes that are safe to retry automatically.
 * These are typically transient issues that may resolve on retry.
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
		return RETRYABLE_CODES.includes( this.code );
	}
}
