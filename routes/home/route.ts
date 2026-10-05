import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		const currentTheme = await resolveSelect( coreStore ).getCurrentTheme();

		// Block themes get the navigable front-end preview in `canvas.tsx`.
		if ( currentTheme?.is_block_theme ) {
			return null;
		}

		return {
			isPreview: true,
			// This route shows the site, so it shows the template around
			// whatever the canvas resolves to, including a static front page.
			renderingMode: 'template-locked' as const,
		};
	},
};
