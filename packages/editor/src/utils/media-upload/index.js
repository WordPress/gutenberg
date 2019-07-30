/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around mediaUpload() that injects the current post ID.
 *
 * @param   {Object}   $0                   Parameters object passed to the function.
 * @param   {?Object}  $0.additionalData    Additional data to include in the request.
 * @param   {string}   $0.allowedTypes      Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param   {Array}    $0.filesList         List of files.
 * @param   {?number}  $0.maxUploadFileSize Maximum upload size in bytes allowed for the site.
 * @param   {Function} $0.onError           Function called when an error happens.
 * @param   {Function} $0.onFileChange      Function called each time a file or a temporary representation of the file is available.
 */
export default function( {
	additionalData = {},
	allowedTypes,
	filesList,
	maxUploadFileSize,
	onError = noop,
	onFileChange,
} ) {
	const { getCurrentPostId, getEditorSettings } = select( 'core/editor' );
	const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes;
	maxUploadFileSize = maxUploadFileSize || getEditorSettings().maxUploadFileSize;

	uploadMedia( {
		allowedTypes,
		filesList,
		onFileChange,
		additionalData: {
			post: getCurrentPostId(),
			...additionalData,
		},
		maxUploadFileSize,
		onError: ( { message } ) => onError( message ),
		wpAllowedMimeTypes,
	} );
}
