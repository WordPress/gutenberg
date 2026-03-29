/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Route configuration for comments list.
 */
export const route = {
	title: async () => {
		return __( 'Comments' );
	},
};
