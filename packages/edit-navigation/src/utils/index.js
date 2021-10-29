/**
 * The purpose of this function is to create a middleware that is responsible for preloading menu-related data.
 * It uses data that is returned from the /__experimental/menus endpoint for requests
 * to the /__experimental/menu/<menuId> endpoint, because the data is the same.
 * This way, we can avoid making additional REST API requests.
 * This middleware can be removed if/when we implement caching at the wordpress/core-data level.
 *
 * @param {Object} preloadedData
 * @return {Function} Preloading middleware.
 */
export function createMenuPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ getStablePath( path ) ] = preloadedData[ path ];
		return result;
	}, /** @type {Record<string, any>} */ ( {} ) );

	let menusDataLoaded = false;
	let menuDataLoaded = false;

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
		if ( ! menusDataLoaded && cache[ path ] ) {
			menusDataLoaded = true;
			return sendSuccessResponse( cache[ path ], parse );
		}

		if ( menuDataLoaded ) {
			return next( options );
		}

		const matches = path.match(
			/^\/__experimental\/menus\/(\d+)\?context=edit$/
		);
		if ( ! matches ) {
			return next( options );
		}

		const key = Object.keys( cache )?.[ 0 ];
		const menuData = cache[ key ]?.body;
		if ( ! menuData ) {
			return next( options );
		}

		const menuId = parseInt( matches[ 1 ] );
		const menu = menuData.filter( ( { id } ) => id === menuId );

		if ( menu.length > 0 ) {
			menuDataLoaded = true;
			// We don't have headers because we "emulate" this request
			return sendSuccessResponse(
				{ body: menu[ 0 ], headers: {} },
				parse
			);
		}

		return next( options );
	};
}

/**
 * This is a helper function that sends a success response.
 *
 * @param {Object}  responseData An object with the menu data
 * @param {boolean} parse        A boolean that controls whether to send a response or just the response data
 * @return {Object} Resolved promise
 */
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
