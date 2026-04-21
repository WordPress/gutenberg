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
	code: string,
	fileName: string
): ErrorMessageConfig {
	const messages: Record< string, ErrorMessageConfig > = {
		[ ErrorCode.NETWORK_ERROR ]: {
			title: __( 'Network error' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Failed to upload "%s" due to a network issue.' ),
				fileName
			),
			action: __( 'Check your internet connection and try again.' ),
		},
		[ ErrorCode.TIMEOUT_ERROR ]: {
			title: __( 'Upload timed out' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'The upload of "%s" took too long.' ),
				fileName
			),
			action: __(
				'Try uploading a smaller file or check your connection.'
			),
		},
		[ ErrorCode.SERVER_ERROR ]: {
			title: __( 'Server error' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'The server encountered an error processing "%s".' ),
				fileName
			),
			action: __( 'Please try again later.' ),
		},
		[ ErrorCode.FILE_TOO_LARGE ]: {
			title: __( 'File too large' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" exceeds the maximum upload size.' ),
				fileName
			),
			action: __( 'Please reduce the file size and try again.' ),
		},
		[ ErrorCode.INVALID_MIME_TYPE ]: {
			title: __( 'Unsupported file type' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" is not a supported file type.' ),
				fileName
			),
			action: __( 'Please upload a different file format.' ),
		},
		[ ErrorCode.INVALID_IMAGE_DIMENSIONS ]: {
			title: __( 'Invalid image dimensions' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" does not match the expected dimensions.' ),
				fileName
			),
			action: __(
				'The image size does not match the target thumbnail size.'
			),
		},
		[ ErrorCode.PERMISSION_DENIED ]: {
			title: __( 'Permission denied' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'You do not have permission to upload "%s".' ),
				fileName
			),
			action: __( 'Please contact your site administrator.' ),
		},
		[ ErrorCode.NOT_FOUND ]: {
			title: __( 'Not found' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'The upload destination for "%s" was not found.' ),
				fileName
			),
			action: __( 'Please refresh the page and try again.' ),
		},
		[ ErrorCode.VALIDATION_ERROR ]: {
			title: __( 'Validation failed' ),
			description: sprintf(
				/* translators: %s: file name */
				__( '"%s" failed validation.' ),
				fileName
			),
			action: __( 'Please check the file and try again.' ),
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
		[ ErrorCode.VIPS_WORKER_ERROR ]: {
			title: __( 'Image processing error' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'An error occurred while processing "%s".' ),
				fileName
			),
			action: __( 'Please try again.' ),
		},
		[ ErrorCode.MEMORY_ERROR ]: {
			title: __( 'Not enough memory' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'Not enough memory to process "%s".' ),
				fileName
			),
			action: __(
				'Try closing other tabs or uploading a smaller image.'
			),
		},
		[ ErrorCode.ABORTED ]: {
			title: __( 'Upload cancelled' ),
			description: sprintf(
				/* translators: %s: file name */
				__( 'The upload of "%s" was cancelled.' ),
				fileName
			),
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
