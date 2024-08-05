interface MediaErrorArgs {
	code: string;
	message: string;
	file: File;
}

/**
 * MediaError class.
 *
 * Small wrapper around the `Error` class
 * to hold an error code and a reference to a file object.
 */
export class MediaError extends Error {
	code: string;
	file: File;

	constructor( { code, message, file }: MediaErrorArgs ) {
		super( message );
		this.code = code;
		this.file = file;
	}
}
