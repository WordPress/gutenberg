/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import mediaUpload from './media-upload';

export { mediaUpload };

export function editorMediaUpload( ...params ) {
	deprecated( 'wp.editor.editorMediaUpload', {
		version: '3.6',
		alternative: 'wp.editor.mediaUpload',
		plugin: 'Gutenberg',
	} );
	mediaUpload( ...params );
}
