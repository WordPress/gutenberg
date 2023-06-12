/**
 * WordPress dependencies
 */
import { getQueryArg } from '@wordpress/url';

export function isPreviewingTheme() {
	return (
		getQueryArg( window.location.href, 'gutenberg_theme_preview' ) !==
		undefined
	);
}

export function currentlyPreviewingTheme() {
	if ( isPreviewingTheme() ) {
		return getQueryArg( window.location.href, 'gutenberg_theme_preview' );
	}
	return null;
}
