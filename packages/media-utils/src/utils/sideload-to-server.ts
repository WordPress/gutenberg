/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Attachment, CreateSideloadFile, RestAttachment } from './types';
import { flattenFormData } from './flatten-form-data';
import { transformAttachment } from './transform-attachment';

/**
 * Sideloads a file to the server using XMLHttpRequest with progress tracking.
 *
 * @param file           Media File to Save.
 * @param attachmentId   Parent attachment ID.
 * @param additionalData Additional data to include in the request.
 * @param signal         Abort signal.
 * @param onProgress     Callback for upload progress (0-100).
 * @return Promise resolving to the sideloaded attachment.
 */
function sideloadWithProgress(
	file: File,
	attachmentId: RestAttachment[ 'id' ],
	additionalData: CreateSideloadFile = {},
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
): Promise< Attachment > {
	return new Promise( ( resolve, reject ) => {
		const data = new FormData();
		data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
		for ( const [ key, value ] of Object.entries( additionalData ) ) {
			flattenFormData(
				data,
				key,
				value as string | Record< string, string > | undefined
			);
		}

		const xhr = new XMLHttpRequest();

		// Handle abort signal
		if ( signal ) {
			if ( signal.aborted ) {
				reject( new DOMException( 'Aborted', 'AbortError' ) );
				return;
			}
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
						new Error(
							`Sideload failed with status ${ xhr.status }`
						)
					);
				}
			}
		};

		xhr.onerror = () => {
			reject( new Error( 'Network error during sideload' ) );
		};

		xhr.onabort = () => {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
		};

		// Build the URL for sideload endpoint
		const path = `/wp/v2/media/${ attachmentId }/sideload`;

		// Get root URL from window location or use relative path
		let url = path;

		// Check if we're in a WordPress environment with REST API root
		if (
			typeof window !== 'undefined' &&
			( window as Window & { wpApiSettings?: { root?: string } } )
				.wpApiSettings?.root
		) {
			const apiRoot = (
				window as Window & { wpApiSettings?: { root?: string } }
			 ).wpApiSettings!.root!;
			url = apiRoot + ( path.startsWith( '/' ) ? path.slice( 1 ) : path );
		}

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
) {
	// Use XHR when progress tracking is needed, otherwise fall back to apiFetch
	if ( onProgress ) {
		return sideloadWithProgress(
			file,
			attachmentId,
			additionalData,
			signal,
			onProgress
		);
	}

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
