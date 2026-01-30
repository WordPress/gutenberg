/**
 * Internal dependencies
 */
import { flattenFormData } from './flatten-form-data';
import type { CreateRestAttachment, CreateSideloadFile } from './types';

/**
 * Creates a FormData object for uploading a file to the media endpoint.
 *
 * @param file           Media file to upload.
 * @param additionalData Additional data to include in the request.
 * @return FormData object ready for upload.
 */
export function createUploadFormData(
	file: File,
	additionalData: CreateRestAttachment = {}
): FormData {
	const data = new FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
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
 * Creates a FormData object for sideloading a file.
 *
 * @param file           Media file to sideload.
 * @param additionalData Additional data to include in the request.
 * @return FormData object ready for sideload.
 */
export function createSideloadFormData(
	file: File,
	additionalData: CreateSideloadFile = {}
): FormData {
	const data = new FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
	for ( const [ key, value ] of Object.entries( additionalData ) ) {
		flattenFormData(
			data,
			key,
			value as string | Record< string, string > | undefined
		);
	}
	return data;
}
