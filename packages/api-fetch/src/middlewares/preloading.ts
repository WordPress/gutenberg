/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, normalizePath } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { APIFetchMiddleware } from '../types';

/**
 * @param preloadedData
 * @return Preloading middleware.
 */
function createPreloadingMiddleware(
	preloadedData: Record< string, any >
): APIFetchMiddleware {
	const cache = Object.fromEntries(
		Object.entries( preloadedData ).map( ( [ path, data ] ) => [
			normalizePath( path ),
			data,
		] )
	);

	// Entries are single-use by default — the preloading middleware
	// deletes each one on first read so a subsequent request gets a
	// fresh response. Callers that know they'll consume the same paths
	// from multiple selectors (e.g. an editor bootstrap that pre-warms
	// resolvers before render) can flip this and then call
	// `__unstableClear` once they're done.
	let multiUse = false;

	const middleware: APIFetchMiddleware = ( options, next ) => {
		const { parse = true } = options;
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
			const data = cache[ path ];
			if ( ! multiUse ) {
				delete cache[ path ];
			}
			return prepareResponse( data, !! parse );
		} else if (
			'OPTIONS' === method &&
			cache[ method ] &&
			cache[ method ][ path ]
		) {
			const data = cache[ method ][ path ];
			if ( ! multiUse ) {
				delete cache[ method ][ path ];
			}
			return prepareResponse( data, !! parse );
		}

		return next( options );
	};

	// Switches this middleware into multi-use mode: cache entries stay
	// around after the first read until `__unstableClear` runs. Useful
	// when multiple selectors share a URL and the consumer guarantees
	// it will clear at the right boundary.
	( middleware as any ).__unstableEnableMultiUse = () => {
		multiUse = true;
	};

	// Drops any still-unconsumed preloaded entries. Used by the editor
	// bootstrap once kickoff resolvers have settled — anything the
	// kickoff missed should fall through to a real network request
	// (and surface in tests / DevTools) instead of being silently served
	// from the preload bucket.
	( middleware as any ).__unstableClear = () => {
		for ( const key of Object.keys( cache ) ) {
			delete cache[ key ];
		}
	};

	return middleware;
}

/**
 * This is a helper function that sends a success response.
 *
 * @param responseData
 * @param parse
 * @return Promise with the response.
 */
function prepareResponse(
	responseData: Record< string, any >,
	parse: boolean
) {
	if ( parse ) {
		return Promise.resolve( responseData.body );
	}

	try {
		return Promise.resolve(
			new window.Response( JSON.stringify( responseData.body ), {
				status: 200,
				statusText: 'OK',
				headers: responseData.headers,
			} )
		);
	} catch {
		// See: https://github.com/WordPress/gutenberg/issues/67358#issuecomment-2621163926.
		Object.entries(
			responseData.headers as Record< string, string >
		).forEach( ( [ key, value ] ) => {
			if ( key.toLowerCase() === 'link' ) {
				responseData.headers[ key ] = value.replace(
					/<([^>]+)>/,
					( _, url ) => `<${ encodeURI( url ) }>`
				);
			}
		} );

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
}

export default createPreloadingMiddleware;
