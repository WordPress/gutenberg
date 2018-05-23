/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { mediaUpload } from '@wordpress/utils';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around mediaUpload() that injects the current post ID.
 *
 * @param   {Object}   $0                   Parameters object passed to the function.
 * @param   {string}   $0.allowedType       The type of media that can be uploaded.
 * @param   {?Object}  $0.additionalData    Additional data to include in the request.
 * @param   {Array}    $0.filesList         List of files.
 * @param   {?number}  $0.maxUploadFileSize Maximum upload size in bytes allowed for the site.
 * @param   {Function} $0.onError           Function called when an error happens.
 * @param   {Function} $0.onFileChange      Function called each time a file or a temporary representation of the file is available.
 */
export default function editorMediaUpload( {
	allowedType,
	filesList,
	maxUploadFileSize,
	onError = noop,
	onFileChange,
} ) {
	const postId = select( 'core/editor' ).getCurrentPostId();

	const errorHandler = ( { file, sizeAboveLimit, generalError } ) => {
		let errorMsg;
		if ( sizeAboveLimit ) {
			errorMsg = sprintf(
				__( '%s exceeds the maximum upload size for this site.' ),
				file.name
			);
		} else if ( generalError ) {
			errorMsg = sprintf(
				__( 'Error while uploading file %s to the media library.' ),
				file.name
			);
		}
		onError( errorMsg );
	};

	mediaUpload( {
		allowedType,
		filesList,
		onFileChange,
		additionalData: {
			post: postId,
		},
		maxUploadFileSize,
		onError: errorHandler,
	} );
}
