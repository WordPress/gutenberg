
/**
 * @param {Object} preloadedData
 * @return {Function} Preloading middleware.
 */
export function createMenuPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ getStablePath( path ) ] = preloadedData[ path ];
		return result;
	}, /** @type {Record<string, any>} */ ( {} ) );

	return ( options, next ) => {
		const { parse = true } = options;
		if ( 'string' !== typeof options.path ) {
			return next( options );
		}

		const method = options.method || 'GET';
		if ( 'GET' !== method ) {
			return next( options );
		}

		const path = getStablePath( options.path );
		if ( cache[ path ] ) {
			return sendSuccessResponse( cache[ path ], parse );
		}

		const matches = path.match(
			/^\/__experimental\/menus\/(\d+)\?context=edit$/
		);
		if ( ! matches ) {
			return next( options );
		}

		const key = Object.keys( cache )?.[ 0 ];
		if ( ! key ) {
			return next( options );
		}

		const menuData = cache[ key ]?.body;
		if ( ! menuData ) {
			return next( options );
		}

		const menuId = parseInt( matches[ 1 ] );
		const menu = menuData.filter( ( { id } ) => {
			return id === menuId;
		} );

		if ( menu ) {
			return sendSuccessResponse( menu );
		}

		return next( options );
	};
}

function sendSuccessResponse( responseData, parse ) {
	return Promise.resolve(
		parse
			? responseData.body
			: new window.Response( JSON.stringify( responseData.body ), {
					status: 200,
					statusText: 'OK',
					headers: responseData.headers,
			  } )
	);
}

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
			.map( ( entry ) => entry.split( '=' ) )
			// [ [ 'a', '5' ], [ 'b, '1' ], [ 'c', '2' ] ]
			.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) )
			// [ 'a=5', 'b=1', 'c=2' ]
			.map( ( pair ) => pair.join( '=' ) )
			// 'a=5&b=1&c=2'
			.join( '&' )
	);
}
