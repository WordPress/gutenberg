/**
 * WordPress dependencies
 */
import { getQueryArg, normalizePath } from '@wordpress/url';

/**
 * @param {Record<string, any>} preloadedData
 * @return {import('../types').APIFetchMiddleware} Preloading middleware.
 */
function createPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ normalizePath( path ) ] = preloadedData[ path ];
		return result;
	}, /** @type {Record<string, any>} */ ( {} ) );

	return ( options, next ) => {
		const { parse = true } = options;
		/** @type {string | void} */
		let rawPath = options.path;
		if ( ! rawPath && options.url ) {
			const pathFromQuery = getQueryArg( options.url, 'rest_route' );
			if ( typeof pathFromQuery === 'string' ) {
				rawPath = pathFromQuery;
			}
		}
		if ( typeof rawPath !== 'string' ) {
			return next( options );
		}

		const method = options.method || 'GET';
		const path = normalizePath( rawPath );

		if ( 'GET' === method && cache[ path ] ) {
			const cacheData = cache[ path ];

			// Unsetting the cache key ensures that the data is only used a single time
			delete cache[ path ];

			return Promise.resolve(
				parse
					? cacheData.body
					: new window.Response( JSON.stringify( cacheData.body ), {
							status: 200,
							statusText: 'OK',
							headers: cacheData.headers,
					  } )
			);
		} else if (
			'OPTIONS' === method &&
			cache[ method ] &&
			cache[ method ][ path ]
		) {
			const cacheData = cache[ method ][ path ];

			// Unsetting the cache key ensures that the data is only used a single time
			delete cache[ method ][ path ];

			return Promise.resolve(
				parse
					? cacheData.body
					: new window.Response( JSON.stringify( cacheData.body ), {
							status: 200,
							statusText: 'OK',
							headers: cacheData.headers,
					  } )
			);
		}

		return next( options );
	};
}

export default createPreloadingMiddleware;
