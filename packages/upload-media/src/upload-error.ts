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

	// Server-side commit error: the client-side files uploaded, but the
	// server failed to finalize the attachment (write its metadata).
	MEDIA_FINALIZE_ERROR = 'MEDIA_FINALIZE_ERROR',

	// The site's storage limit (a multisite upload quota) rejected the file.
	STORAGE_LIMIT_REACHED = 'STORAGE_LIMIT_REACHED',

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

/**
 * Tells whether an error is the site's storage limit rejecting a file.
 *
 * @param error The error to check.
 * @return Whether the storage limit caused the error.
 */
export function isStorageLimitError( error: unknown ): boolean {
	return (
		( error as { code?: unknown } | null | undefined )?.code ===
		ErrorCode.STORAGE_LIMIT_REACHED
	);
}
