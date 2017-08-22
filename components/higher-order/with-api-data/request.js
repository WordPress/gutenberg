/**
 * External dependencies
 */
import memoize from 'memize';

export const cache = {};

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

export function getResponseFromCache( request ) {
	const response = cache[ getStablePath( request.path ) ];
	return Promise.resolve( response );
}

export function getResponseFromNetwork( request ) {
	const promise = wp.apiRequest( request ).promise();

	if ( isRequestMethod( request, 'GET' ) ) {
		promise.then( ( data ) => {
			cache[ getStablePath( request.path ) ] = data;
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
