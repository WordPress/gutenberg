/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { createUploadFormData } from './create-upload-form-data';
import { transformAttachment } from './transform-attachment';
import { xhrUpload } from './xhr-upload';
import type { Attachment, CreateRestAttachment, RestAttachment } from './types';

const UPLOAD_PATH = '/wp/v2/media?_embed=wp:featuredmedia';

export async function uploadToServer(
	file: File,
	additionalData: CreateRestAttachment = {},
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
): Promise< Attachment > {
	const data = createUploadFormData( file, additionalData );

	// Use XHR when progress tracking is needed, otherwise fall back to apiFetch.
	if ( onProgress ) {
		return transformAttachment(
			await xhrUpload< RestAttachment >(
				UPLOAD_PATH,
				data,
				signal,
				onProgress
			)
		);
	}

	return transformAttachment(
		await apiFetch< RestAttachment >( {
			// This allows the video block to directly get a video's poster image.
			path: UPLOAD_PATH,
			body: data,
			method: 'POST',
			signal,
		} )
	);
}
