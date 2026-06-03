/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		return {
			isPreview: true,
		};
	},
};
