/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const visibilityOptions = {
	public: {
		label: __( 'Public' ),
		info: __( 'Visible to everyone.' ),
	},
	private: {
		label: __( 'Private' ),
		info: __( 'Only visible to site admins and editors.' ),
	},
	password: {
		label: __( 'Password protected' ),
		info: __( 'Only those with the password can view this post.' ),
	},
};
