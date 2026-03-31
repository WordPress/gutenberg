/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { buildRestUrl } from './build-rest-url';

/**
 * Sends a FormData payload via XMLHttpRequest with upload progress tracking.
 *
 * Handles nonce authentication, abort signal cleanup, and credential
 * forwarding. Used by both upload and sideload paths to avoid duplication.
 *
 * @param path       REST API path (e.g. '/wp/v2/media?_embed=wp:featuredmedia').
 * @param data       FormData payload to send.
 * @param signal     Optional abort signal.
 * @param onProgress Optional callback for upload progress (0-100).
 * @return Promise resolving to the parsed JSON response.
 */
export function xhrUpload< T >(
	path: string,
	data: FormData,
	signal?: AbortSignal,
	onProgress?: ( progress: number ) => void
): Promise< T > {
	return new Promise( ( resolve, reject ) => {
		if ( signal?.aborted ) {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
			return;
		}

		const xhr = new XMLHttpRequest();

		// Wire up abort signal with proper cleanup via { once: true }.
		const onAbort = () => xhr.abort();
		if ( signal ) {
			signal.addEventListener( 'abort', onAbort, { once: true } );
		}

		// Remove abort listener once the request finishes (any outcome).
		const cleanup = () => {
			if ( signal ) {
				signal.removeEventListener( 'abort', onAbort );
			}
		};

		xhr.upload.onprogress = ( event ) => {
			if ( event.lengthComputable && onProgress ) {
				const progress = Math.round(
					( event.loaded / event.total ) * 100
				);
				onProgress( progress );
			}
		};

		xhr.onload = () => {
			cleanup();
			if ( xhr.status >= 200 && xhr.status < 300 ) {
				try {
					resolve( JSON.parse( xhr.responseText ) as T );
				} catch {
					reject( new Error( 'Invalid JSON response' ) );
				}
			} else {
				try {
					reject( JSON.parse( xhr.responseText ) );
				} catch {
					reject(
						new Error( `Upload failed with status ${ xhr.status }` )
					);
				}
			}
		};

		xhr.onerror = () => {
			cleanup();
			reject( new Error( 'Network error during upload' ) );
		};

		xhr.onabort = () => {
			cleanup();
			reject( new DOMException( 'Aborted', 'AbortError' ) );
		};

		const url = buildRestUrl( path );
		xhr.open( 'POST', url );
		xhr.setRequestHeader( 'Accept', 'application/json, */*;q=0.1' );

		if ( apiFetch.nonceMiddleware?.nonce ) {
			xhr.setRequestHeader(
				'X-WP-Nonce',
				apiFetch.nonceMiddleware.nonce
			);
		}

		xhr.withCredentials = true;
		xhr.send( data );
	} );
}
