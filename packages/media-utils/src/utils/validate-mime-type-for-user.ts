import { __, sprintf } from '@wordpress/i18n';
import { UploadError } from './upload-error';
import { getMimeTypesArray } from './get-mime-types-array';

/**
 * Verifies if the file's extension is one the user is allowed to upload.
 *
 * @param fileName           File name.
 * @param wpAllowedMimeTypes List of allowed mime types and file extensions.
 */
function isAllowedExtensionForUser(
	fileName: string,
	wpAllowedMimeTypes: Record< string, string >
) {
	// `mediaUpload` is also called with raw Blobs, which have no name.
	if ( typeof fileName !== 'string' || ! fileName.includes( '.' ) ) {
		return false;
	}

	const extension = fileName.split( '.' ).pop()?.toLowerCase();

	if ( ! extension ) {
		return false;
	}

	return Object.keys( wpAllowedMimeTypes ).some( ( extensionsString ) =>
		extensionsString.toLowerCase().split( '|' ).includes( extension )
	);
}

/**
 * Verifies if the user is allowed to upload this mime type.
 *
 * @param file               File object.
 * @param wpAllowedMimeTypes List of allowed mime types and file extensions.
 */
export function validateMimeTypeForUser(
	file: File,
	wpAllowedMimeTypes?: Record< string, string > | null
) {
	// Allowed types for the current WP_User.
	const allowedMimeTypesForUser = getMimeTypesArray( wpAllowedMimeTypes );

	if ( ! allowedMimeTypesForUser || ! wpAllowedMimeTypes ) {
		return;
	}

	/*
	 * Browsers derive `file.type` from the extension with their own lookup
	 * table, which disagrees with WordPress's (`audio/x-m4a` vs `audio/mpeg`).
	 * WordPress validates uploads by extension, so trust that instead.
	 */
	if ( isAllowedExtensionForUser( file.name, wpAllowedMimeTypes ) ) {
		return;
	}

	const isAllowedMimeTypeForUser = allowedMimeTypesForUser.includes(
		file.type
	);

	if ( file.type && ! isAllowedMimeTypeForUser ) {
		throw new UploadError( {
			code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
			message: sprintf(
				// translators: %s: file name.
				__(
					'%s: Sorry, you are not allowed to upload this file type.'
				),
				file.name
			),
			file,
		} );
	}
}
