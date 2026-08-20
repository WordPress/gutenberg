import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

async function isBlockTheme() {
	const currentTheme = await resolveSelect( coreStore ).getCurrentTheme();
	return !! currentTheme?.is_block_theme;
}

/**
 * Route configuration for styles.
 */
export const route = {
	title: () => __( 'Styles' ),

	// Classic themes have no global styles to edit, so the style book is all
	// this route has to show.
	stage: isBlockTheme,

	async canvas( context: any ) {
		// Use the custom canvas (StyleBookPreview) when the style book is the
		// only thing to render, or when its preview is toggled on. Otherwise,
		// use the default editor canvas.
		if (
			context.search.preview === 'stylebook' ||
			! ( await isBlockTheme() )
		) {
			return null;
		}
		return {
			isPreview: true,
		};
	},
};
