/**
 * Get the params from a location as a key/value pair object.
 *
 * @param {Object} location Window location
 * @return {Object} Params
 */
const getParams = ( location ) => {
	const params = {};
	if ( location.search ) {
		location.search.substr( 1 ).split`&`.forEach( ( item ) => {
			const [ key, value ] = item.split( '=' );
			params[ key ] = decodeURIComponent( value );
		} );
	}
	return params;
};

/**
 * Get the full URL if a relative path is passed.
 *
 * @param {string} url URL
 * @return {string} Full URL
 */
const getFullUrl = ( url ) => {
	const { origin, pathname, search } = window.location;

	if ( url.indexOf( '#' ) === 0 ) {
		return origin + pathname + search + url;
	}

	if ( url.indexOf( 'http' ) === 0 ) {
		return url;
	}

	return origin + url;
};

/**
 * Check to see if a URL matches a given window location.
 *
 * @param {Object} location Window location
 * @param {string} url URL to compare
 * @param {boolean} exact Exact match or loose matching with search args
 * @return {boolean} Matching or not
 */
export const isMatchingUrl = ( location, url, exact ) => {
	if ( ! url ) {
		return;
	}

	const fullUrl = getFullUrl( url );
	const domain = new URL( fullUrl ).origin;
	const isHash = url.indexOf( '#' ) === 0;
	const { hash, pathname, search } = location;
	const { origin } = window.location;

	if ( exact || isHash ) {
		return origin + pathname + search + hash === fullUrl;
	}

	const urlParams = getParams( location );
	const locationParams = getParams( window.location );
	let hasMatchingParams = true;

	Object.keys( urlParams ).forEach( ( key ) => {
		if ( urlParams[ key ] !== locationParams[ key ] ) {
			hasMatchingParams = false;
		}
	} );

	return origin === domain && hasMatchingParams;
};

/**
 * Adds a listener that runs on history change.
 *
 * @param {Function} listener Listener to add on history change.
 * @return {Function} Function to remove listeners.
 */
export const addHistoryListener = ( listener ) => {
	// Monkey path pushState to allow trigger the pushstate event listener.
	( ( history ) => {
		const pushState = history.pushState;
		history.pushState = function ( state ) {
			/* global CustomEvent */
			const pushStateEvent = new CustomEvent( 'pushstate', {
				state,
			} );
			window.dispatchEvent( pushStateEvent );
			return pushState.apply( history, arguments );
		};
	} )( window.history );

	window.addEventListener( 'popstate', listener );
	window.addEventListener( 'pushstate', listener );

	return () => {
		window.removeEventListener( 'popstate', listener );
		window.removeEventListener( 'pushstate', listener );
	};
};
