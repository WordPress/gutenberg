/**
 * Internal dependencies
 */
import parseResponseAndNormalizeError from '../utils/response';

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

	const retry = ( response ) => {
		const attachmentId = response.headers.get( 'x-wp-upload-attachment-id' );
		const shouldRetry = !! attachmentId && retries < maxRetries;

		if ( ! shouldRetry ) {
			if ( attachmentId ) {
				next( {
					path: `/wp/v2/media/${ attachmentId }`,
					method: 'DELETE',
				} );
			}
			return Promise.reject( response );
		}

		retries++;
		return next( {
			path: `/wp/v2/media/${ attachmentId }/post-process`,
			method: 'POST',
			data: { action: 'create-image-subsizes' },
			parse: false,
		} )
			.then( ( res ) => parseResponseAndNormalizeError( res, options.parse ) )
			.catch( retry );
	};

	return next( { ...options, parse: false } )
		.then( ( response ) => parseResponseAndNormalizeError( response, options.parse ) )
		.catch( retry );
}

export default mediaUploadMiddleware;
