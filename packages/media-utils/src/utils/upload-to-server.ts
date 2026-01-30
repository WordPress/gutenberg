/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { buildRestUrl } from './build-rest-url';
import { createUploadFormData } from './create-upload-form-data';
import { transformAttachment } from './transform-attachment';
import type { Attachment, CreateRestAttachment, RestAttachment } from './types';

/**
 * Uploads a file to the server using XMLHttpRequest with progress tracking.
 *
 * @param file           Media File to Save.
 * @param additionalData Additional data to include in the request.
 * @param signal         Abort signal.
 * @param onProgress     Callback for upload progress (0-100).
 * @return Promise resolving to the uploaded attachment.
 */
function uploadWithProgress(
	file: File,
	additionalData: CreateRestAttachment = {},
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
): Promise< Attachment > {
	return new Promise( ( resolve, reject ) => {
		// Handle abort signal - check early before creating resources.
		if ( signal?.aborted ) {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
			return;
		}

		const data = createUploadFormData( file, additionalData );
		const xhr = new XMLHttpRequest();

		if ( signal ) {
			signal.addEventListener( 'abort', () => {
				xhr.abort();
			} );
		}

		// Track upload progress
		xhr.upload.onprogress = ( event ) => {
			if ( event.lengthComputable && onProgress ) {
				const progress = Math.round(
					( event.loaded / event.total ) * 100
				);
				onProgress( progress );
			}
		};

		xhr.onload = () => {
			if ( xhr.status >= 200 && xhr.status < 300 ) {
				try {
					const response = JSON.parse(
						xhr.responseText
					) as RestAttachment;
					resolve( transformAttachment( response ) );
				} catch {
					reject( new Error( 'Invalid JSON response' ) );
				}
			} else {
				// Try to parse error response
				try {
					const errorResponse = JSON.parse( xhr.responseText );
					reject( errorResponse );
				} catch {
					reject(
						new Error( `Upload failed with status ${ xhr.status }` )
					);
				}
			}
		};

		xhr.onerror = () => {
			reject( new Error( 'Network error during upload' ) );
		};

		xhr.onabort = () => {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
		};

		// Build the URL using the helper that handles plain permalinks and _locale.
		const url = buildRestUrl( '/wp/v2/media?_embed=wp:featuredmedia' );

		xhr.open( 'POST', url );

		// Set headers
		xhr.setRequestHeader( 'Accept', 'application/json, */*;q=0.1' );

		// Add nonce header if available
		if ( apiFetch.nonceMiddleware?.nonce ) {
			xhr.setRequestHeader(
				'X-WP-Nonce',
				apiFetch.nonceMiddleware.nonce
			);
		}

		// Include credentials for cookie-based auth
		xhr.withCredentials = true;

		xhr.send( data );
	} );
}

export async function uploadToServer(
	file: File,
	additionalData: CreateRestAttachment = {},
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
) {
	// Use XHR when progress tracking is needed, otherwise fall back to apiFetch
	if ( onProgress ) {
		return uploadWithProgress( file, additionalData, signal, onProgress );
	}

	// Create upload payload using the shared helper.
	const data = createUploadFormData( file, additionalData );

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
