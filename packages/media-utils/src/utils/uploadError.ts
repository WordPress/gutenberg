interface UploadErrorArgs {
	code: string;
	message: string;
	file: File;
}

/**
 * UploadError class.
 *
 * Small wrapper around the `Error` class
 * to hold an error code and a reference to a file object.
 */
export class UploadError extends Error {
	code: string;
	file: File;

	constructor( { code, message, file }: UploadErrorArgs ) {
		super( message );
		this.code = code;
		this.file = file;
	}
}
