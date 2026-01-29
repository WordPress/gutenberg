/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { CreateSideloadFile, RestAttachment } from './types';
import { flattenFormData } from './flatten-form-data';
import { transformAttachment } from './transform-attachment';

/**
 * Uploads a file to the server without creating an attachment.
 *
 * @param file           Media File to Save.
 * @param attachmentId   Parent attachment ID.
 * @param additionalData Additional data to include in the request.
 * @param signal         Abort signal.
 *
 * @return The saved attachment.
 */
export async function sideloadToServer(
	file: File,
	attachmentId: RestAttachment[ 'id' ],
	additionalData: CreateSideloadFile = {},
	signal?: AbortSignal
) {
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

	return transformAttachment(
		await apiFetch< RestAttachment >( {
			path: `/wp/v2/media/${ attachmentId }/sideload`,
			body: data,
			method: 'POST',
			signal,
		} )
	);
}
