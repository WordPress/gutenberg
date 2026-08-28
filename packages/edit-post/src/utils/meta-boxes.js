import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the URL a meta boxes iframe loads: the meta box loader URL with
 * the parameter that trims the classic screen down to the given locations.
 *
 * @param {string} location `main` for the normal and advanced locations
 *                          rendered in the bottom pane, or `side` for the
 *                          side location rendered in the settings sidebar.
 *
 * @return {string|undefined} The URL, if the meta box loader URL is known.
 */
export function getMetaBoxesIframeUrl( location = 'main' ) {
	if ( ! window._wpMetaBoxUrl ) {
		return undefined;
	}
	return addQueryArgs( window._wpMetaBoxUrl, {
		'gutenberg-meta-box-iframe': location,
	} );
}

/**
 * Returns the name of the iframe rendering the given meta box locations.
 *
 * @param {string} location `main` or `side`.
 *
 * @return {string} The iframe name.
 */
export function getMetaBoxesIframeName( location = 'main' ) {
	return location === 'side'
		? 'gutenberg-meta-boxes-side'
		: 'gutenberg-meta-boxes';
}
