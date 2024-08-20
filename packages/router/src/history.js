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

const locationMemo = new WeakMap();
function getLocationWithParams() {
	const location = history.location;
	let locationWithParams = locationMemo.get( location );
	if ( ! locationWithParams ) {
		locationWithParams = {
			...location,
			params: Object.fromEntries(
				new URLSearchParams( location.search )
			),
		};
		locationMemo.set( location, locationWithParams );
	}
	return locationWithParams;
}

history.push = push;
history.replace = replace;
history.getLocationWithParams = getLocationWithParams;

export default history;
