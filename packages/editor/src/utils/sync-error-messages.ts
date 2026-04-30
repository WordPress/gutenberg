/**
 * WordPress dependencies
 */
import { type ConnectionError } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

// These error codes are defined in the sync package:
// packages/sync/src/errors.ts
export const AUTHENTICATION_FAILED = 'authentication-failed';
export const CONNECTION_EXPIRED = 'connection-expired';
export const CONNECTION_LIMIT_EXCEEDED = 'connection-limit-exceeded';
export const DOCUMENT_SIZE_LIMIT_EXCEEDED = 'document-size-limit-exceeded';
export const UNKNOWN_ERROR = 'unknown-error';

interface ConnectionErrorMessages {
	description: string;
	title: string;
}

/**
 * Default error messages for known error codes.
 */
const ERROR_MESSAGES: Record< string, ConnectionErrorMessages > = {
	[ AUTHENTICATION_FAILED ]: {
		title: __( 'Unable to connect' ),
		description: __(
			"Real-time collaboration couldn't verify your permissions. " +
				'Check that you have access to edit this post or contact your site administrator.'
		),
	},
	[ CONNECTION_EXPIRED ]: {
		title: __( 'Connection expired' ),
		description: __(
			'Your connection to real-time collaboration has timed out. ' +
				'Editing is paused to prevent conflicts with other editors.'
		),
	},
	[ CONNECTION_LIMIT_EXCEEDED ]: {
		title: __( 'Too many editors connected' ),
		description: __(
			'Real-time collaboration has reached its connection limit. ' +
				'Try again later or contact your site administrator.'
		),
	},
	// DOCUMENT_SIZE_LIMIT_EXCEEDED is not included here because it results in
	// collaboration being disabled entirely.
	[ UNKNOWN_ERROR ]: {
		title: __( 'Connection lost' ),
		description: __(
			'The connection to real-time collaboration was interrupted. ' +
				'Editing is paused to prevent conflicts with other editors.'
		),
	},
};

/**
 * Get user-facing title and description from a sync connection error.
 *
 * Provides default messages based on error.code.
 *
 * @param error - Connection error.
 * @return Object with title, description, and canRetry flag.
 */
export function getSyncErrorMessages(
	error?: ConnectionError
): ConnectionErrorMessages {
	if ( error?.code && ERROR_MESSAGES[ error?.code ] ) {
		return ERROR_MESSAGES[ error.code ];
	}

	return ERROR_MESSAGES[ UNKNOWN_ERROR ];
}
