import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { notFound } from '@wordpress/route';
import { getPreviewedStylesheet, getPreviewTitle } from './previewed-theme';

async function isBlockTheme() {
	const currentTheme = await resolveSelect( coreStore ).getCurrentTheme();
	return !! currentTheme?.is_block_theme;
}

/**
 * Route configuration for the block theme preview screen.
 *
 * The screen previews the theme named by the `wp_theme_preview` query
 * parameter, which Core resolves on every request — REST requests included —
 * so entities like the current theme, its templates, and its global styles
 * resolve against the previewed theme. See `gutenberg_get_theme_preview_url()`
 * for the full account.
 */
export const route = {
	beforeLoad: () => {
		// Without the parameter there is no theme to preview.
		if ( ! getPreviewedStylesheet() ) {
			throw notFound();
		}
	},
	title: async () => {
		const theme = await resolveSelect( coreStore ).getCurrentTheme();
		return getPreviewTitle(
			theme?.name?.rendered
				? decodeEntities( theme.name.rendered )
				: undefined
		);
	},

	// Classic themes have no global styles to edit, so the style book is all
	// this route has to show.
	stage: isBlockTheme,

	async canvas( context: any ) {
		// Use the custom canvas (StyleBookPreview) when the style book is the
		// only thing to render, or when its preview is toggled on. Otherwise,
		// use the default editor canvas, which previews the homepage.
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
