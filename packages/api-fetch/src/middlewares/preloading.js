/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, normalizePath } from '@wordpress/url';

/**
 * @param {Record<string, any>} preloadedData
 * @return {import('../types').APIFetchMiddleware} Preloading middleware.
 */
export function createPreloadingMiddleware( preloadedData ) {
	const cache = Object.fromEntries(
		Object.entries( preloadedData ).map( ( [ path, data ] ) => [
			normalizePath( path ),
			data,
		] )
	);

	return ( options, next ) => {
		const { parse = true } = options;
		/** @type {string | void} */
		let rawPath = options.path;
		if ( ! rawPath && options.url ) {
			const { rest_route: pathFromQuery, ...queryArgs } = getQueryArgs(
				options.url
			);

			if ( typeof pathFromQuery === 'string' ) {
				rawPath = addQueryArgs( pathFromQuery, queryArgs );
			}
		}

		if ( typeof rawPath !== 'string' ) {
			return next( options );
		}

		const method = options.method || 'GET';
		const path = normalizePath( rawPath );

		if ( 'GET' === method && cache[ path ] ) {
			const cacheData = cache[ path ];

			// Unsetting the cache key ensures that the data is only used a single time.
			delete cache[ path ];

			return prepareResponse( cacheData, !! parse );
		} else if (
			'OPTIONS' === method &&
			cache[ method ] &&
			cache[ method ][ path ]
		) {
			const cacheData = cache[ method ][ path ];

			// Unsetting the cache key ensures that the data is only used a single time.
			delete cache[ method ][ path ];

			return prepareResponse( cacheData, !! parse );
		}

		return next( options );
	};
}

/**
 * This is a helper function that sends a success response.
 *
 * @param {Record<string, any>} responseData
 * @param {boolean}             parse
 * @return {Promise<any>} Promise with the response.
 */
function prepareResponse( responseData, parse ) {
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
