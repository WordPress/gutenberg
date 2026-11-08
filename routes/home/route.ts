import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		return {
			isPreview: true,
			// This route shows the site, so it shows the template around
			// whatever the canvas resolves to, including a static front page.
			renderingMode: 'template-locked' as const,
		};
	},
};
