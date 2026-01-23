/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { UploadError } from './upload-error';

/**
 * Verifies whether the file is within the file upload size limits for the site.
 *
 * @param file              File object.
 * @param maxUploadFileSize Maximum upload size in bytes allowed for the site.
 */
export function validateFileSize( file: File, maxUploadFileSize?: number ) {
	// Don't allow empty files to be uploaded.
	if ( file.size <= 0 ) {
		throw new UploadError( {
			code: 'EMPTY_FILE',
			message: sprintf(
				// translators: %s: file name.
				__( '%s: This file is empty.' ),
				file.name
			),
			file,
		} );
	}

	if ( maxUploadFileSize && file.size > maxUploadFileSize ) {
		throw new UploadError( {
			code: 'SIZE_ABOVE_LIMIT',
			message: sprintf(
				// translators: %s: file name.
				__(
					'%s: This file exceeds the maximum upload size for this site.'
				),
				file.name
			),
			file,
		} );
	}
}
