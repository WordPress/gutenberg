import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { getQueryArg } from '@wordpress/url';

/**
 * Route configuration for the block theme preview screen.
 *
 * The screen previews the theme named by the `wp_theme_preview` query
 * parameter. WordPress Core reads that same parameter on every request to
 * resolve the previewed theme (see `wp-includes/theme-previews.php`): it
 * filters `stylesheet`/`template` and registers an apiFetch middleware that
 * forwards the parameter on every REST request, so all entities on this
 * screen resolve against the previewed theme.
 */
export const route = {
	beforeLoad: () => {
		// Without the parameter there is no theme to preview.
		if ( ! getQueryArg( window.location.href, 'wp_theme_preview' ) ) {
			throw notFound();
		}
	},
	title: () => __( 'Theme Preview' ),
};
