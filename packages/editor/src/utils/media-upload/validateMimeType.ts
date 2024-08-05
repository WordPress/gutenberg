/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import {
	validateMimeType as _validateMimeType,
	validateMimeTypeForUser,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Verifies if the caller (e.g. a block) supports this mime type.
 *
 * @param file         File object.
 * @param allowedTypes Array with the types of media that can be uploaded, if unset all types are allowed.
 */
export function validateMimeType( file: File, allowedTypes?: string[] ) {
	const { getEditorSettings } = select( editorStore );
	// @ts-ignore
	const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes;

	validateMimeTypeForUser( file, wpAllowedMimeTypes );
	_validateMimeType( file, allowedTypes );
}
