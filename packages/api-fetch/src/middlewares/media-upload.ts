/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	parseAndThrowError,
	parseResponseAndNormalizeError,
} from '../utils/response';
import type { APIFetchOptions, APIFetchMiddleware } from '../types';

/**
 * @param options
 * @return True if the request is for media upload.
 */
function isMediaUploadRequest( options: APIFetchOptions ) {
	const isCreateMethod = !! options.method && options.method === 'POST';
	const isMediaEndpoint =
		( !! options.path && options.path.indexOf( '/wp/v2/media' ) !== -1 ) ||
		( !! options.url && options.url.indexOf( '/wp/v2/media' ) !== -1 );

	return isMediaEndpoint && isCreateMethod;
}

/**
 * Middleware handling media upload failures and retries.
 * @param options
 * @param next
 */
const mediaUploadMiddleware: APIFetchMiddleware = ( options, next ) => {
	if ( ! isMediaUploadRequest( options ) ) {
		return next( options );
	}

	let retries = 0;
	const maxRetries = 5;

	/**
	 * @param attachmentId
	 * @return Processed post response.
	 */
	const postProcess = ( attachmentId: string ): Promise< any > => {
		retries++;
		return next( {
			path: `/wp/v2/media/${ attachmentId }/post-process`,
			method: 'POST',
			data: { action: 'create-image-subsizes' },
			parse: false,
		} ).catch( () => {
			if ( retries < maxRetries ) {
				return postProcess( attachmentId );
			}
			next( {
				path: `/wp/v2/media/${ attachmentId }?force=true`,
				method: 'DELETE',
			} );

			return Promise.reject();
		} );
	};

	return next( { ...options, parse: false } )
		.catch( ( response: Response ) => {
			// `response` could actually be an error thrown by `defaultFetchHandler`.
			if ( ! ( response instanceof globalThis.Response ) ) {
				return Promise.reject( response );
			}

			const attachmentId = response.headers.get(
				'x-wp-upload-attachment-id'
			);
			if (
				response.status >= 500 &&
				response.status < 600 &&
				attachmentId
			) {
				return postProcess( attachmentId ).catch( () => {
					if ( options.parse !== false ) {
						return Promise.reject( {
							code: 'post_process',
							message: __(
								'Media upload failed. If this is a photo or a large image, please scale it down and try again.'
							),
						} );
					}

					return Promise.reject( response );
				} );
			}
			return parseAndThrowError( response, options.parse );
		} )
		.then( ( response: Response ) =>
			parseResponseAndNormalizeError( response, options.parse )
		);
};

export default mediaUploadMiddleware;
