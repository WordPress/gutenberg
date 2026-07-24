/**
 * Error codes for upload operations.
 *
 * These codes categorize the different types of failures that can occur
 * during the upload process, enabling user-friendly error messages.
 */
export enum ErrorCode {
	// Validation errors
	EMPTY_FILE = 'EMPTY_FILE',
	SIZE_ABOVE_LIMIT = 'SIZE_ABOVE_LIMIT',
	MIME_TYPE_NOT_SUPPORTED = 'MIME_TYPE_NOT_SUPPORTED',
	MIME_TYPE_NOT_ALLOWED_FOR_USER = 'MIME_TYPE_NOT_ALLOWED_FOR_USER',

	// Processing errors (the same file will fail again)
	HEIC_DECODE_ERROR = 'HEIC_DECODE_ERROR',
	IMAGE_TRANSCODING_ERROR = 'IMAGE_TRANSCODING_ERROR',
	IMAGE_ROTATION_ERROR = 'IMAGE_ROTATION_ERROR',
	MEDIA_TRANSCODING_ERROR = 'MEDIA_TRANSCODING_ERROR',
	GIF_TRANSCODING_ERROR = 'GIF_TRANSCODING_ERROR',

	// Generic fallback
	GENERAL = 'GENERAL',
}

interface UploadErrorArgs {
	code: ErrorCode | string;
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
	code: ErrorCode | string;
	file: File;

	constructor( { code, message, file, cause }: UploadErrorArgs ) {
		super( message, { cause } );

		Object.setPrototypeOf( this, new.target.prototype );

		this.code = code;
		this.file = file;
	}
}
