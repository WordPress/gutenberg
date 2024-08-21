/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { validateFileSize as _validateFileSize } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Verifies whether the file is within the file upload size limits for the site.
 *
 * @param file File object.
 */
export function validateFileSize( file: File ) {
	const { getEditorSettings } = select( editorStore );
	// @ts-ignore
	return _validateFileSize( file, getEditorSettings().maxUploadFileSize );
}
