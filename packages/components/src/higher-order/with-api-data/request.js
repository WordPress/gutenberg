/**
 * External dependencies
 */
import memoize from 'memize';
import { mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import fetch from '@wordpress/fetch';

export const getStablePath = memoize( ( path ) => {
	const [ base, query ] = path.split( '?' );
	if ( ! query ) {
		return base;
	}

	// 'b=1&c=2&a=5'
	return base + '?' + query

		// [ 'b=1', 'c=2', 'a=5' ]
		.split( '&' )

		// [ [ 'b, '1' ], [ 'c', '2' ], [ 'a', '5' ] ]
		.map( ( entry ) => entry.split( '=' ) )

		// [ [ 'a', '5' ], [ 'b, '1' ], [ 'c', '2' ] ]
		.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )

		// [ 'a=5', 'b=1', 'c=2' ]
		.map( ( pair ) => pair.join( '=' ) )

		// 'a=5&b=1&c=2'
		.join( '&' );
} );

/**
 * Response cache of path to response (object of data, headers arrays).
 * Optionally populated from window global for preloading.
 *
 * @type {Object}
 */
export const cache = mapKeys(
	window._wpAPIDataPreload,
	( value, key ) => getStablePath( key )
);

/**
 * Returns a response payload if GET request and a cached result exists, or
 * undefined otherwise.
 *
 * @param {Object} request Request object (path, method).
 *
 * @return {?Object} Response object (body, headers).
 */
export function getCachedResponse( request ) {
	if ( isRequestMethod( request, 'GET' ) ) {
		return cache[ getStablePath( request.path ) ];
	}
}

export function getResponseFromNetwork( request ) {
	const promise = fetch( { ...request, parse: false } )
		.then( ( response ) => {
			return {
				body: response.json(),
				headers: response.headers,
			};
		} );

	if ( isRequestMethod( request, 'GET' ) ) {
		promise.then( ( response ) => {
			cache[ getStablePath( request.path ) ] = response;
		} );
	}

	// Upgrade jQuery.Deferred to native promise
	return Promise.resolve( promise );
}

export function isRequestMethod( request, method ) {
	return request.method === method;
}

export default function( request ) {
	const cachedResponse = getCachedResponse( request );
	if ( cachedResponse ) {
		return Promise.resolve( cachedResponse );
	}

	return getResponseFromNetwork( request );
}
