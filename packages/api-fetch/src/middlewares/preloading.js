/**
 * Given a path, returns a normalized path where equal query parameter values
 * will be treated as identical, regardless of order they appear in the original
 * text.
 *
 * @param {string} path Original path.
 *
 * @return {string} Normalized path.
 */
export function getStablePath( path ) {
	const splitted = path.split( '?' );
	const query = splitted[ 1 ];
	const base = splitted[ 0 ];
	if ( ! query ) {
		return base;
	}

	// 'b=1&c=2&a=5'
	return (
		base +
		'?' +
		query
			// [ 'b=1', 'c=2', 'a=5' ]
			.split( '&' )
			// [ [ 'b, '1' ], [ 'c', '2' ], [ 'a', '5' ] ]
			.map( function( entry ) {
				return entry.split( '=' );
			} )
			// [ [ 'a', '5' ], [ 'b, '1' ], [ 'c', '2' ] ]
			.sort( function( a, b ) {
				return a[ 0 ].localeCompare( b[ 0 ] );
			} )
			// [ 'a=5', 'b=1', 'c=2' ]
			.map( function( pair ) {
				return pair.join( '=' );
			} )
			// 'a=5&b=1&c=2'
			.join( '&' )
	);
}

function createPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ getStablePath( path ) ] = preloadedData[ path ];
		return result;
	}, {} );

	return ( options, next ) => {
		const { parse = true } = options;
		if ( typeof options.path === 'string' ) {
			const method = options.method || 'GET';
			const path = getStablePath( options.path );

			if ( parse && 'GET' === method && cache[ path ] ) {
				return Promise.resolve( cache[ path ].body );
			} else if (
				'OPTIONS' === method &&
				cache[ method ] &&
				cache[ method ][ path ]
			) {
				return Promise.resolve( cache[ method ][ path ] );
			}
		}

		return next( options );
	};
}

export default createPreloadingMiddleware;
