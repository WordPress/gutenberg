/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { CreateSideloadFile, RestAttachment, SubSizeData } from './types';
import { flattenFormData } from './flatten-form-data';

/**
 * Uploads a file to the server without creating an attachment.
 *
 * Returns lightweight sub-size data instead of a full attachment.
 * The client accumulates these responses and sends them to the
 * finalize endpoint.
 *
 * @param file           Media File to Save.
 * @param attachmentId   Parent attachment ID.
 * @param additionalData Additional data to include in the request.
 * @param signal         Abort signal.
 *
 * @return Sub-size data for the uploaded file.
 */
export async function sideloadToServer(
	file: File,
	attachmentId: RestAttachment[ 'id' ],
	additionalData: CreateSideloadFile = {},
	signal?: AbortSignal
): Promise< SubSizeData > {
	// Create upload payload.
	const data = new FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
	for ( const [ key, value ] of Object.entries( additionalData ) ) {
		flattenFormData(
			data,
			key,
			value as string | Record< string, string > | undefined
		);
	}

	return apiFetch< SubSizeData >( {
		path: `/wp/v2/media/${ attachmentId }/sideload`,
		body: data,
		method: 'POST',
		signal,
	} );
}
