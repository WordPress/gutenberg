/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { mediaUpload } from '@wordpress/utils';

export default function editorMediaUpload( filesList, onFileChange, allowedType ) {
	return mediaUpload( filesList, onFileChange, allowedType, select( 'core/editor' ).getCurrentPostId() );
}
