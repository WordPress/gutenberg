/**
 * WordPress dependencies
 */
import { normalizePath } from '@wordpress/url';

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
	return normalizePath( path );
}

/**
 * @param {Record<string, any>} preloadedData
 * @return {import('../types').APIFetchMiddleware} Preloading middleware.
 */
function createPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ getStablePath( path ) ] = preloadedData[ path ];
		return result;
	}, /** @type {Record<string, any>} */ ( {} ) );

	return ( options, next ) => {
		const { parse = true } = options;
		if ( typeof options.path === 'string' ) {
			const method = options.method || 'GET';
			const path = getStablePath( options.path );

			if ( 'GET' === method && cache[ path ] ) {
				const cacheData = cache[ path ];

				// Unsetting the cache key ensures that the data is only used a single time
				delete cache[ path ];

				return Promise.resolve(
					parse
						? cacheData.body
						: new window.Response(
								JSON.stringify( cacheData.body ),
								{
									status: 200,
									statusText: 'OK',
									headers: cacheData.headers,
								}
						  )
				);
			} else if (
				'OPTIONS' === method &&
				cache[ method ] &&
				cache[ method ][ path ]
			) {
				const cacheData = cache[ method ][ path ];

				// Unsetting the cache key ensures that the data is only used a single time
				delete cache[ method ][ path ];

				return Promise.resolve( parse ? cacheData.body : cacheData );
			}
		}

		return next( options );
	};
}

export default createPreloadingMiddleware;
