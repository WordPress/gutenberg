/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, normalizePath } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { APIFetchMiddleware } from '../types';

export const ENABLE_MULTI_USE = Symbol( 'preloadingEnableMultiUse' );
export const CLEAR = Symbol( 'preloadingClear' );

/**
 * @param preloadedData
 * @return Preloading middleware.
 */
function createPreloadingMiddleware(
	preloadedData: Record< string, any >
): APIFetchMiddleware {
	const { OPTIONS = {}, ...GET } = Object.fromEntries(
		Object.entries( preloadedData ).map( ( [ path, data ] ) => [
			normalizePath( path ),
			data,
		] )
	) as Record< string, any > & { OPTIONS?: Record< string, any > };

	// Preload entries that haven't been served yet.
	const unusedGet = new Set< string >( Object.keys( GET ) );
	const unusedOptions = new Set< string >( Object.keys( OPTIONS ) );

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

		if ( 'GET' === method && GET[ path ] ) {
			const data = GET[ path ];
			if ( ! multiUse ) {
				delete GET[ path ];
			}
			unusedGet.delete( path );
			return prepareResponse( data, !! parse );
		} else if ( 'OPTIONS' === method && OPTIONS[ path ] ) {
			const data = OPTIONS[ path ];
			if ( ! multiUse ) {
				delete OPTIONS[ path ];
			}
			unusedOptions.delete( path );
			return prepareResponse( data, !! parse );
		}

		return next( options );
	};

	( middleware as any )[ ENABLE_MULTI_USE ] = () => {
		multiUse = true;
	};

	( middleware as any )[ CLEAR ] = (): void => {
		const tags = [
			...Array.from( unusedGet, ( p ) => `GET ${ p }` ),
			...Array.from( unusedOptions, ( p ) => `OPTIONS ${ p }` ),
		];
		if ( tags.length ) {
			// eslint-disable-next-line no-console
			console.warn(
				'[api-fetch][preload] Some preloads were never consumed:',
				tags
			);
		} else {
			// eslint-disable-next-line no-console
			console.log( '[api-fetch][preload] All preloads consumed.' );
		}
		unusedGet.clear();
		unusedOptions.clear();
		for ( const key of Object.keys( GET ) ) {
			delete GET[ key ];
		}
		for ( const key of Object.keys( OPTIONS ) ) {
			delete OPTIONS[ key ];
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
