const createPreloadingMiddleware = ( preloadedData ) => ( options, next ) => {
	function getStablePath( path ) {
		const splitted = path.split( '?' );
		const query = splitted[ 1 ];
		const base = splitted[ 0 ];
		if ( ! query ) {
			return base;
		}

		// 'b=1&c=2&a=5'
		return base + '?' + query
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
			.join( '&' );
	}

	const { parse = true } = options;
	if ( typeof options.path === 'string' ) {
		const method = options.method || 'GET';
		const path = getStablePath( options.path );

		if ( parse && 'GET' === method && preloadedData[ path ] ) {
			return Promise.resolve( preloadedData[ path ].body );
		} else if ( 'OPTIONS' === method && preloadedData[ method ][ path ] ) {
			return Promise.resolve( preloadedData[ method ][ path ] );
		}
	}

	return next( options );
};

export default createPreloadingMiddleware;
