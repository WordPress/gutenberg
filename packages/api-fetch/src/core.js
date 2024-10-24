/**
 * WordPress dependencies
 */
//import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	parseResponseAndNormalizeError,
	parseAndThrowError,
} from './utils/response';

/**
 * Default set of header values which should be sent with every request unless
 * explicitly provided through apiFetch options.
 *
 * @type {Record<string, string>}
 */
const DEFAULT_HEADERS = {
	// The backend uses the Accept header as a condition for considering an
	// incoming request as a REST request.
	//
	// See: https://core.trac.wordpress.org/ticket/44534
	Accept: 'application/json, */*;q=0.1',
};

/**
 * Default set of fetch option values which should be sent with every request
 * unless explicitly provided through apiFetch options.
 *
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
	credentials: 'include',
};

/**
 * Checks the status of a response, throwing the Response as an error if
 * it is outside the 200 range.
 *
 * @param {Response} response
 * @return {Response} The response if the status is in the 200 range.
 */
const checkStatus = ( response ) => {
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	throw response;
};

/** @typedef {(options: import('./types').APIFetchOptions) => Promise<any>} FetchHandler*/

/**
 * @type {FetchHandler}
 */
const defaultFetchHandler = ( nextOptions ) => {
	const { url, path, data, parse = true, ...remainingOptions } = nextOptions;
	let { body, headers } = nextOptions;

	// Merge explicitly-provided headers with default values.
	headers = { ...DEFAULT_HEADERS, ...headers };

	// The `data` property is a shorthand for sending a JSON body.
	if ( data ) {
		body = JSON.stringify( data );
		headers[ 'Content-Type' ] = 'application/json';
	}

	const responsePromise = window.fetch(
		// Fall back to explicitly passing `window.location` which is the behavior if `undefined` is passed.
		url || path || window.location.href,
		{
			...DEFAULT_OPTIONS,
			...remainingOptions,
			body,
			headers,
		}
	);

	return responsePromise.then(
		( value ) =>
			Promise.resolve( value )
				.then( checkStatus )
				.catch( ( response ) => parseAndThrowError( response, parse ) )
				.then( ( response ) =>
					parseResponseAndNormalizeError( response, parse )
				),
		( err ) => {
			// Re-throw AbortError for the users to handle it themselves.
			if ( err && err.name === 'AbortError' ) {
				throw err;
			}

			// Otherwise, there is most likely no network connection.
			// Unfortunately the message might depend on the browser.
			throw {
				code: 'fetch_error',
				message: 'You are probably offline.',
			};
		}
	);
};

/** @type {FetchHandler} */
let fetchHandler = defaultFetchHandler;

/**
 * Defines a custom fetch handler for making the requests that will override
 * the default one using window.fetch
 *
 * @param {FetchHandler} newFetchHandler The new fetch handler
 */
export function setFetchHandler( newFetchHandler ) {
	fetchHandler = newFetchHandler;
}

/** @type { typeof import('./middlewares/singleton').middlewares } */
let middlewares;

/**
 * @template T
 * @param {import('./types').APIFetchOptions} options
 * @return {Promise<T>} A promise representing the request processed via the registered middlewares.
 */
export async function apiFetch( options ) {
	if ( ! middlewares ) {
		middlewares = ( await import( './middlewares/singleton' ) ).middlewares;
	}

	// creates a nested function chain that calls all middlewares and finally the `fetchHandler`,
	// converting `middlewares = [ m1, m2, m3 ]` into:
	// ```
	// opts1 => m1( opts1, opts2 => m2( opts2, opts3 => m3( opts3, fetchHandler ) ) );
	// ```
	const enhancedHandler = middlewares.reduceRight(
		( /** @type {FetchHandler} */ next, middleware ) => {
			return ( workingOptions ) => middleware( workingOptions, next );
		},
		fetchHandler
	);

	return enhancedHandler( options ).catch( ( error ) => {
		if ( error.code !== 'rest_cookie_invalid_nonce' ) {
			return Promise.reject( error );
		}

		// If the nonce is invalid, refresh it and try again.
		return (
			window
				// @ts-ignore
				.fetch( apiFetch.nonceEndpoint )
				.then( checkStatus )
				.then( ( data ) => data.text() )
				.then( ( text ) => {
					// @ts-ignore
					apiFetch.nonceMiddleware.nonce = text;
					return apiFetch( options );
				} )
		);
	} );
}
