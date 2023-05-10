/**
 * WordPress dependencies
 */
import { getQueryArg } from '@wordpress/url';

export function isPreviewingTheme() {
	return (
		window?.__experimentalEnableThemePreviews &&
		getQueryArg( window.location.href, 'theme_preview' ) !== undefined
	);
}

export function currentlyPreviewingTheme() {
	if ( isPreviewingTheme() ) {
		return getQueryArg( window.location.href, 'theme_preview' );
	}
	return null;
}
