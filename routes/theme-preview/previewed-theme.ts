import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/*
 * The previewed theme's stylesheet, from the `wp_theme_preview` query
 * parameter ('' when absent), read once per page load.
 *
 * Deliberately read from `window.location` rather than the router: the
 * router parses only the client path inside the `p` parameter, while Core
 * reads `$_GET['wp_theme_preview']` from the real request URL — so the
 * parameter must live outside `p`. The router preserves it across client
 * navigations, so it cannot change without a full page load.
 */
const previewedStylesheet = ( () => {
	const value = getQueryArg( window.location.href, 'wp_theme_preview' );
	return typeof value === 'string' ? value : '';
} )();

export function getPreviewedStylesheet() {
	return previewedStylesheet;
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
