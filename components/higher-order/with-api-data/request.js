/**
 * External dependencies
 */
import memoize from 'memize';
import { mapKeys } from 'lodash';

export const getStablePath = memoize( ( path ) => {
	const [ base, query ] = path.split( '?' );
	if ( ! query ) {
		return base;
	}

	return base + '?' + query
		// 'b=1&c=2&a=5'

		.split( '&' )
		// [ 'b=1', 'c=2', 'a=5' ]

		.map( ( entry ) => entry.split( '=' ) )
		// [ [ 'b, '1' ], [ 'c', '2' ], [ 'a', '5' ] ]

		.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
		// [ [ 'a', '5' ], [ 'b, '1' ], [ 'c', '2' ] ]

		.map( ( pair ) => pair.join( '=' ) )
		// [ 'a=5', 'b=1', 'c=2' ]

		.join( '&' );
		// 'a=5&b=1&c=2'
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
 * Given an XMLHttpRequest object, returns an array of header tuples.
 *
 * @see https://xhr.spec.whatwg.org/#the-getallresponseheaders()-method
 *
 * @param  {XMLHttpRequest} xhr XMLHttpRequest object
 * @return {Array[]}            Array of header tuples
 */
export function getResponseHeaders( xhr ) {
	return xhr.getAllResponseHeaders().trim()
		// 'date: Tue, 22 Aug 2017 18:45:28 GMT↵server: nginx'

		.split( '\u000d\u000a' )
		// [ 'date: Tue, 22 Aug 2017 18:45:28 GMT', 'server: nginx' ]

		.map( ( entry ) => entry.split( '\u003a\u0020' ) );
		// [ [ 'date', 'Tue, 22 Aug 2017 18:45:28 GMT' ], [ 'server', 'nginx' ] ]
}

export function getResponseFromCache( request ) {
	const response = cache[ getStablePath( request.path ) ];
	return Promise.resolve( response );
}

export function getResponseFromNetwork( request ) {
	const promise = wp.apiRequest( request )
		.then( ( body, status, xhr ) => {
			return {
				body,
				headers: getResponseHeaders( xhr ),
			};
		} );

	if ( isRequestMethod( request, 'GET' ) ) {
		promise.then( ( response ) => {
			cache[ getStablePath( request.path ) ] = response;
		} );
	}

	return promise;
}

export function isRequestMethod( request, method ) {
	return request.method === method;
}

export default function( request ) {
	if ( ! isRequestMethod( request, 'GET' ) ) {
		return getResponseFromNetwork( request );
	}

	return getResponseFromCache( request )
		.then( ( response ) => (
			undefined === response
				? getResponseFromNetwork( request )
				: response
		) );
}
