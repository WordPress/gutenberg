/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { transformAttachment } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const noop = () => {};

/**
 * Sideloads an external image into the media library from its URL.
 *
 * The server downloads the remote file, which avoids a cross-origin browser
 * fetch that fails when the editor is cross-origin isolated. Since the server
 * owns the upload it also generates sub-sizes, as with a regular upload.
 *
 * @param {Object}   $0           Parameters object.
 * @param {string}   $0.url       URL of the external image to sideload.
 * @param {Function} $0.onSuccess Function called with the new attachment on success.
 * @param {Function} $0.onError   Function called with an error message on failure.
 */
export default function mediaSideloadFromUrl( {
	url,
	onSuccess,
	onError = noop,
} ) {
	const currentPost = select( editorStore ).getCurrentPost();
	// Templates and template parts store their numerical ID in `wp_id`.
	const currentPostId =
		typeof currentPost?.id === 'number'
			? currentPost.id
			: currentPost?.wp_id;
	const postData = currentPostId ? { post: currentPostId } : {};

	apiFetch( {
		path: '/wp/v2/media',
		method: 'POST',
		data: {
			url,
			...postData,
		},
	} )
		.then( ( attachment ) => {
			onSuccess?.( transformAttachment( attachment ) );
		} )
		.catch( ( error ) => {
			onError( error?.message || error );
		} );
}
