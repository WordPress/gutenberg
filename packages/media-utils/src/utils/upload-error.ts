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
}
