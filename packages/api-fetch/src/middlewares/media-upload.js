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

/**
 * Middleware handling media upload failures and retries.
 *
 * @param {Object}   options Fetch options.
 * @param {Function} next    [description]
 *
 * @return {*} The evaluated result of the remaining middleware chain.
 */
function mediaUploadMiddleware( options, next ) {
	const isMediaUploadRequest =
		( options.path && options.path.indexOf( '/wp/v2/media' ) !== -1 ) ||
		( options.url && options.url.indexOf( '/wp/v2/media' ) !== -1 );

	if ( ! isMediaUploadRequest ) {
		return next( options, next );
	}
	let retries = 0;
	const maxRetries = 5;

	const postProcess = ( attachmentId ) => {
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
		.catch( ( response ) => {
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
		.then( ( response ) =>
			parseResponseAndNormalizeError( response, options.parse )
		);
}

export default mediaUploadMiddleware;
