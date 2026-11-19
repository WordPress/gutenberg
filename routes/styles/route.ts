import { resolveSelect, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	getPreviewedStylesheet,
	getPreviewTitle,
	isThemePreviewAdminPage,
} from './previewed-theme';
import { STYLE_BOOK_PREFERENCE, shouldShowStyleBook } from './utils';

async function isBlockTheme() {
	const currentTheme = await resolveSelect( coreStore ).getCurrentTheme();
	return !! currentTheme?.is_block_theme;
}

/**
 * Route configuration for styles.
 *
 * The route also serves the theme preview page, rendering the same screen
 * for the theme named by the `wp_theme_preview` query parameter, which Core
 * resolves on every request — REST requests included. See
 * `gutenberg_get_theme_preview_url()` for the full account.
 */
export const route = {
	beforeLoad: () => {
		if ( isThemePreviewAdminPage() && ! getPreviewedStylesheet() ) {
			throw notFound();
		}
	},

	title: async () => {
		if ( ! getPreviewedStylesheet() ) {
			return __( 'Styles' );
		}
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
		// only thing to render, or when it is shown: by `preview=stylebook`,
		// or by the user's preference when the URL doesn't say. Otherwise,
		// use the default editor canvas.
		const isStyleBookOpened =
			context.search.preview === 'stylebook' ||
			shouldShowStyleBook(
				context.search.section ?? '/',
				select( preferencesStore ).get(
					'core/edit-site',
					STYLE_BOOK_PREFERENCE
				) as boolean | undefined
			);
		if ( isStyleBookOpened || ! ( await isBlockTheme() ) ) {
			return null;
		}
		return {
			isPreview: true,
			// Styling the site means styling the template around it, so it is
			// shown even when the canvas resolves to a static front page.
			renderingMode: 'template-locked' as const,
		};
	},
};
