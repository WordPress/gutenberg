/**
 * Internal dependencies
 */
import { flattenFormData } from './flatten-form-data';
import type { CreateRestAttachment, CreateSideloadFile } from './types';

/**
 * Creates a FormData object for a file upload to the REST API.
 *
 * @param file           The file to upload.
 * @param additionalData Additional key/value pairs to include in the request.
 * @return FormData object ready to be sent.
 */
function buildFormData(
	file: File,
	additionalData: Record< string, unknown > = {}
): FormData {
	const data = new FormData();

	// Ensure the file has a name, falling back to a name derived from MIME type.
	const fileName = file.name || file.type.replace( '/', '.' );
	const fileToUpload =
		file.name === fileName
			? file
			: new File( [ file ], fileName, { type: file.type } );
	data.append( 'file', fileToUpload );

	// Add any additional data using the flatten helper for nested objects.
	for ( const [ key, value ] of Object.entries( additionalData ) ) {
		flattenFormData(
			data,
			key,
			value as string | Record< string, string > | undefined
		);
	}

	return data;
}

/**
 * Creates a FormData object for uploading a file to the REST API.
 *
 * @param file           The file to upload.
 * @param additionalData Additional data to include in the request.
 * @return FormData object ready to be sent.
 */
export function createUploadFormData(
	file: File,
	additionalData: CreateRestAttachment = {}
): FormData {
	return buildFormData( file, additionalData );
}

/**
 * Creates a FormData object for sideloading a file to the REST API.
 *
 * @param file           The file to sideload.
 * @param additionalData Additional data to include in the request.
 * @return FormData object ready to be sent.
 */
export function createSideloadFormData(
	file: File,
	additionalData: CreateSideloadFile = {}
): FormData {
	return buildFormData( file, additionalData );
}
