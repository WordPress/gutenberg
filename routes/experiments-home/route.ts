/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Experiments' ),
	loader: async () => {
		await apiFetch( { path: '/wp/v2/settings', method: 'OPTIONS' } );
	},
};
