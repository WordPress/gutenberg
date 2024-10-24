/**
 * External dependencies
 */
import { createBrowserHistory, type BrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { buildQueryString } from '@wordpress/url';

export interface EnhancedHistory extends BrowserHistory {
	getLocationWithParams: () => Location;
}

interface PushOptions {
	transition?: string;
}

const history = createBrowserHistory();

const originalHistoryPush = history.push;
const originalHistoryReplace = history.replace;

// Preserve the `wp_theme_preview` query parameter when navigating
// around the Site Editor.
// TODO: move this hack out of the router into Site Editor code.
function preserveThemePreview( params: Record< string, any > ) {
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

function push(
	params: Record< string, any >,
	state: Record< string, any >,
	options: PushOptions = {}
) {
	const performPush = () => {
		const search = buildQueryString( preserveThemePreview( params ) );
		return originalHistoryPush.call( history, { search }, state );
	};

	/*
	 * Skip transition in mobile, otherwise it crashes the browser.
	 * See: https://github.com/WordPress/gutenberg/pull/63002.
	 */
	const isMediumOrBigger = window.matchMedia( '(min-width: 782px)' ).matches;
	if (
		! isMediumOrBigger ||
		// @ts-expect-error
		! document.startViewTransition ||
		! options.transition
	) {
		return performPush();
	}
	document.documentElement.classList.add( options.transition );
	// @ts-expect-error
	const transition = document.startViewTransition( () => performPush() );
	transition.finished.finally( () => {
		document.documentElement.classList.remove( options.transition ?? '' );
	} );
}

function replace(
	params: Record< string, any >,
	state: Record< string, any >
) {
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

export default {
	...history,
	push,
	replace,
	getLocationWithParams,
};
