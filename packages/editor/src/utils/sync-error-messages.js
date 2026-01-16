/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Default error messages for known error codes.
 */
const ERROR_CODE_DEFAULTS = {
	'too-many-connections': {
		title: __( 'Connection Limit Reached' ),
		description: __(
			'The collaborative editing server has reached its maximum connection capacity. ' +
				'Please try again later or contact your site administrator.'
		),
	},
	'auth-failed': {
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
};

/**
 * Get user-facing title and description from a sync connection error.
 *
 * Provides default messages based on error.code, which can be overridden
 * by error.message and error.description.
 *
 * @param {Object} error - Connection error object.
 * @return {Object} Object with title and description strings.
 */
export function getSyncErrorMessages( error ) {
	if ( ! error ) {
		return { title: '', description: '' };
	}

	// Look up defaults based on code
	const defaults = ERROR_CODE_DEFAULTS[ error.code ];

	// Use explicit message/description if provided, otherwise fall back to defaults
	return {
		title: error.message || defaults?.title || __( 'Disconnected' ),
		description:
			error.description ||
			defaults?.description ||
			__(
				'You are currently disconnected from the collaborative editing server. ' +
					'Editing is temporarily disabled to prevent conflicts.'
			),
	};
}
