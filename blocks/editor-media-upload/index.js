/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { mediaUpload } from '@wordpress/utils';

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around mediaUpload() that injects the current post ID.
 *
 * @param {Array}    filesList    List of files.
 * @param {Function} onFileChange Function to be called each time a file or a temporary representation of the file is available.
 * @param {string}   allowedType  The type of media that can be uploaded.
 */
export default function editorMediaUpload( filesList, onFileChange, allowedType ) {
	mediaUpload( filesList, onFileChange, allowedType, select( 'core/editor' ).getCurrentPostId() );
}
