/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { flattenFormData } from './flatten-form-data';
import { transformAttachment } from './transform-attachment';
import type { CreateRestAttachment, RestAttachment } from './types';

export async function uploadToServer(
	file: File,
	additionalData: CreateRestAttachment = {},
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
			// This allows the video block to directly get a video's poster image.
			path: '/wp/v2/media?_embed=wp:featuredmedia',
			body: data,
			method: 'POST',
			signal,
		} )
	);
}
