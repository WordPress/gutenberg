/**
 * External dependencies
 */
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { buildQueryString } from '@wordpress/url';

const history = createBrowserHistory();

const originalHistoryPush = history.push;
const originalHistoryReplace = history.replace;

// Preserve the `wp_theme_preview` query parameter when navigating
// around the Site Editor.
// TODO: move this hack out of the router into Site Editor code.
function preserveThemePreview( params ) {
	if ( params.hasOwnProperty( 'wp_theme_preview' ) ) {
		return params;
	}
	const currentSearch = new URLSearchParams( history.location.search );
	const currentThemePreview = currentSearch.get( 'wp_theme_preview' );
	if ( currentThemePreview === null ) {
		return params;
	}
	return { ...params, wp_theme_preview: currentThemePreview };
}

function push( params, state ) {
	const search = buildQueryString( preserveThemePreview( params ) );
	return originalHistoryPush.call( history, { search }, state );
}

function replace( params, state ) {
	const search = buildQueryString( preserveThemePreview( params ) );
	return originalHistoryReplace.call( history, { search }, state );
}

history.push = push;
history.replace = replace;

export default history;
