import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { notFound } from '@wordpress/route';
import { getPreviewedStylesheet, getPreviewTitle } from './previewed-theme';

/**
 * Route configuration for the block theme preview screen.
 *
 * The screen previews the theme named by the `wp_theme_preview` query
 * parameter, which Core resolves on every request — REST requests included —
 * so entities like the current theme resolve against the previewed theme.
 * See `gutenberg_get_theme_preview_url()` for the full account.
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
};
