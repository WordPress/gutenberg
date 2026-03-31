/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { createSideloadFormData } from './create-upload-form-data';
import { transformAttachment } from './transform-attachment';
import { xhrUpload } from './xhr-upload';
import type { Attachment, CreateSideloadFile, RestAttachment } from './types';

/**
 * Uploads a file to the server without creating an attachment.
 *
 * @param file           Media File to Save.
 * @param attachmentId   Parent attachment ID.
 * @param additionalData Additional data to include in the request.
 * @param signal         Abort signal.
 * @param onProgress     Callback for upload progress (0-100).
 *
 * @return The saved attachment.
 */
export async function sideloadToServer(
	file: File,
	attachmentId: RestAttachment[ 'id' ],
	additionalData: CreateSideloadFile = {},
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
): Promise< Attachment > {
	const path = `/wp/v2/media/${ attachmentId }/sideload`;
	const data = createSideloadFormData( file, additionalData );

	// Use XHR when progress tracking is needed, otherwise fall back to apiFetch.
	if ( onProgress ) {
		return transformAttachment(
			await xhrUpload< RestAttachment >( path, data, signal, onProgress )
		);
	}

	return transformAttachment(
		await apiFetch< RestAttachment >( {
			path,
			body: data,
			method: 'POST',
			signal,
		} )
	);
}
