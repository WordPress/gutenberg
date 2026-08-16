import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		const currentTheme = await resolveSelect( coreStore ).getCurrentTheme();

		// Classic themes have no block templates for the editor canvas to
		// resolve, so fall back to the custom canvas, which previews the site's
		// front end in an iframe.
		if ( ! currentTheme?.is_block_theme ) {
			return null;
		}

		return {
			isPreview: true,
		};
	},
};
