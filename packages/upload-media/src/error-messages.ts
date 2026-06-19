/**
 * User-friendly error messages for upload failures.
 *
 * Provides localized, human-readable messages for all error codes
 * with actionable guidance for users.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ErrorCode } from './upload-error';

/**
 * Configuration for an error message.
 */
export interface ErrorMessageConfig {
	/** Short title describing the error type. */
	title: string;
	/** Detailed description of what happened. */
	description: string;
	/** Optional actionable guidance for the user. */
	action?: string;
}

/**
 * Gets a user-friendly error message configuration for an error code.
 *
 * @param code     The error code from UploadError.
 * @param fileName The name of the file that failed to upload.
 * @return Error message configuration with title, description, and action.
 */
export function getErrorMessage(
	code: ErrorCode | string,
	fileName: string
): ErrorMessageConfig {
	const messages: Record< string, ErrorMessageConfig > = {
		[ ErrorCode.EMPTY_FILE ]: {
			title: __( 'Empty file' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" is empty.' ),
				fileName
			),
			action: __( 'Please choose a different file.' ),
		},
		[ ErrorCode.SIZE_ABOVE_LIMIT ]: {
			title: __( 'File too large' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" exceeds the maximum upload size.' ),
				fileName
			),
			action: __( 'Please reduce the file size and try again.' ),
		},
		[ ErrorCode.MIME_TYPE_NOT_SUPPORTED ]: {
			title: __( 'Unsupported file type' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" is not a supported file type.' ),
				fileName
			),
			action: __( 'Please upload a different file format.' ),
		},
		[ ErrorCode.MIME_TYPE_NOT_ALLOWED_FOR_USER ]: {
			title: __( 'File type not allowed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'You are not allowed to upload "%s".' ),
				fileName
			),
			action: __( 'Please contact your site administrator.' ),
		},
		[ ErrorCode.HEIC_DECODE_ERROR ]: {
			title: __( 'HEIC decode failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to decode HEIC file "%s".' ),
				fileName
			),
			action: __( 'Try converting the image to JPEG or PNG first.' ),
		},
		[ ErrorCode.IMAGE_TRANSCODING_ERROR ]: {
			title: __( 'Image processing failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to process "%s".' ),
				fileName
			),
			action: __( 'The image may be corrupted. Try a different file.' ),
		},
		[ ErrorCode.IMAGE_ROTATION_ERROR ]: {
			title: __( 'Image rotation failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to rotate "%s".' ),
				fileName
			),
			action: __( 'The image may be corrupted. Try a different file.' ),
		},
		[ ErrorCode.MEDIA_TRANSCODING_ERROR ]: {
			title: __( 'Media processing failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to convert "%s" to the target format.' ),
				fileName
			),
			action: __( 'The file may be corrupted. Try a different file.' ),
		},
		[ ErrorCode.GENERAL ]: {
			title: __( 'Upload failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to upload "%s".' ),
				fileName
			),
			action: __( 'Please try again.' ),
		},
	};

	return (
		messages[ code ] || {
			title: __( 'Upload failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to upload "%s".' ),
				fileName
			),
			action: __( 'Please try again.' ),
		}
	);
}
