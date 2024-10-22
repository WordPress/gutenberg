/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { UploadError } from './upload-error';

/**
 * Verifies if the caller (e.g. a block) supports this mime type.
 *
 * @param file         File object.
 * @param allowedTypes List of allowed mime types.
 */
export function validateMimeType( file: File, allowedTypes?: string[] ) {
	if ( ! allowedTypes ) {
		return;
	}

	// Allowed type specified by consumer.
	const isAllowedType = allowedTypes.some( ( allowedType ) => {
		// If a complete mimetype is specified verify if it matches exactly the mime type of the file.
		if ( allowedType.includes( '/' ) ) {
			return allowedType === file.type;
		}
		// Otherwise a general mime type is used, and we should verify if the file mimetype starts with it.
		return file.type.startsWith( `${ allowedType }/` );
	} );

	if ( file.type && ! isAllowedType ) {
		throw new UploadError( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
			message: sprintf(
				// translators: %s: file name.
				__( '%s: Sorry, this file type is not supported here.' ),
				file.name
			),
			file,
		} );
	}
}
