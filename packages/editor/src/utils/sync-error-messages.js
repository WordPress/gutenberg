/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Default error messages for known error codes.
 */
const ERROR_MESSAGES = {
	'authentication-failed': {
		title: __( 'Authentication Failed' ),
		description: __(
			'Authentication with the collaborative editing server failed. ' +
				'Please verify that you have the necessary permissions.'
		),
	},
	'connection-expired': {
		title: __( 'Connection Expired' ),
		description: __(
			'The connection to the collaborative editing server has expired.'
		),
	},
	'connection-limit-exceeded': {
		title: __( 'Connection Limit Exceeded' ),
		description: __(
			'The collaborative editing server has reached its maximum connection capacity. ' +
				'Please try again later or contact your site administrator.'
		),
	},
	'unknown-error': {
		title: __( 'Disconnected' ),
		description: __(
			'You are currently disconnected from the collaborative editing server. ' +
				'Editing is temporarily disabled to prevent conflicts.'
		),
	},
};

/**
 * Get user-facing title and description from a sync connection error.
 *
 * Provides default messages based on error.code.
 *
 * @param {Object} error - Connection error object.
 * @return {Object} Object with title and description strings.
 */
export function getSyncErrorMessages( error ) {
	if ( ERROR_MESSAGES[ error?.code ] ) {
		return ERROR_MESSAGES[ error.code ];
	}

	return ERROR_MESSAGES[ 'unknown-error' ];
}
