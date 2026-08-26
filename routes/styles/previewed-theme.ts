import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

const THEME_PREVIEW_ADMIN_PAGE = 'theme-preview-wp-admin';

/*
 * Read from `window.location` rather than the router: the router only parses
 * the client path inside `p`, while Core reads the parameter from the real
 * request URL. The router preserves it across client navigations, so it
 * cannot change without a full page load.
 */
const previewedStylesheet = ( () => {
	const value = getQueryArg( window.location.href, 'wp_theme_preview' );
	return typeof value === 'string' ? value : '';
} )();

export function getPreviewedStylesheet() {
	return previewedStylesheet;
}

/**
 * Whether this route is rendered on the standalone theme preview admin page,
 * rather than inside the site editor.
 */
export function isThemePreviewAdminPage() {
	return (
		new URLSearchParams( window.location.search ).get( 'page' ) ===
		THEME_PREVIEW_ADMIN_PAGE
	);
}

/**
 * Formats the screen title for a previewed theme.
 *
 * @param themeName The previewed theme's decoded name, when known.
 */
export function getPreviewTitle( themeName?: string ) {
	return themeName
		? sprintf(
				/* translators: %s: Theme name. */
				__( 'Previewing %s' ),
				themeName
		  )
		: __( 'Theme Preview' );
}
