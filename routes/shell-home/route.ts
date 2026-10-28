import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Site' ),
	// The site shell renders this route's canvas itself, behind every route,
	// so the site stays loaded while admin screens open above it.
	async canvas() {
		return null;
	},
};
