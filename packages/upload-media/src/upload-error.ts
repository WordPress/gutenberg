/**
 * Error codes for upload operations.
 *
 * These codes categorize different types of failures that can occur
 * during the upload process, allowing for appropriate retry strategies
 * and user-friendly error messages.
 */
export enum ErrorCode {
	// Validation errors (non-retryable)
	EMPTY_FILE = 'EMPTY_FILE',
	SIZE_ABOVE_LIMIT = 'SIZE_ABOVE_LIMIT',
	MIME_TYPE_NOT_SUPPORTED = 'MIME_TYPE_NOT_SUPPORTED',
	MIME_TYPE_NOT_ALLOWED_FOR_USER = 'MIME_TYPE_NOT_ALLOWED_FOR_USER',

	// Processing errors (not retryable — the same file will fail again)
	HEIC_DECODE_ERROR = 'HEIC_DECODE_ERROR',
	IMAGE_TRANSCODING_ERROR = 'IMAGE_TRANSCODING_ERROR',
	IMAGE_ROTATION_ERROR = 'IMAGE_ROTATION_ERROR',
	MEDIA_TRANSCODING_ERROR = 'MEDIA_TRANSCODING_ERROR',

	// Network / server errors (retryable). Not currently produced by the
	// package, but the vocabulary lets consumers wrap fetch failures in
	// UploadError and drive retry decisions off `isRetryable`.
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT_ERROR = 'TIMEOUT_ERROR',
	SERVER_ERROR = 'SERVER_ERROR',

	// User action
	ABORTED = 'ABORTED',

	// Generic fallback
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
