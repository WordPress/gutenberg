/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';
import createPreloadingMiddleware from './middlewares/preloading';
import fetchAllMiddleware from './middlewares/fetch-all-middleware';
import namespaceEndpointMiddleware from './middlewares/namespace-endpoint';
import httpV1Middleware from './middlewares/http-v1';
import userLocaleMiddleware from './middlewares/user-locale';
import mediaUploadMiddleware from './middlewares/media-upload';
import createThemePreviewMiddleware from './middlewares/theme-preview';
import {
	parseResponseAndNormalizeError,
	parseAndThrowError,
} from './utils/response';
import type {
	APIFetchMiddleware,
	APIFetchOptions,
	FetchHandler,
} from './types';

/**
 * Default set of header values which should be sent with every request unless
 * explicitly provided through apiFetch options.
 */
const DEFAULT_HEADERS: APIFetchOptions[ 'headers' ] = {
	// The backend uses the Accept header as a condition for considering an
	// incoming request as a REST request.
	//
	// See: https://core.trac.wordpress.org/ticket/44534
	Accept: 'application/json, */*;q=0.1',
};

/**
 * Default set of fetch option values which should be sent with every request
 * unless explicitly provided through apiFetch options.
 */
const DEFAULT_OPTIONS: APIFetchOptions = {
	credentials: 'include',
};

const middlewares: Array< APIFetchMiddleware > = [
	userLocaleMiddleware,
	namespaceEndpointMiddleware,
	httpV1Middleware,
	fetchAllMiddleware,
];

/**
 * Register a middleware
 *
 * @param middleware
 */
function registerMiddleware( middleware: APIFetchMiddleware ) {
	middlewares.unshift( middleware );
}

const defaultFetchHandler: FetchHandler = ( nextOptions ) => {
	const { url, path, data, parse = true, ...remainingOptions } = nextOptions;
	let { body, headers } = nextOptions;

	// Merge explicitly-provided headers with default values.
	headers = { ...DEFAULT_HEADERS, ...headers };

	// The `data` property is a shorthand for sending a JSON body.
	if ( data ) {
		body = JSON.stringify( data );
		headers[ 'Content-Type' ] = 'application/json';
	}

	const responsePromise = globalThis.fetch(
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
		( response ) => {
			// If the response is not 2xx, still parse the response body as JSON
			// but throw the JSON as error.
			if ( ! response.ok ) {
				return parseAndThrowError( response, parse );
			}

			return parseResponseAndNormalizeError( response, parse );
		},
		( err ) => {
			// Re-throw AbortError for the users to handle it themselves.
			if ( err && err.name === 'AbortError' ) {
				throw err;
			}

			// If the browser reports being offline, we'll just assume that
			// this is why the request failed.
			if ( ! globalThis.navigator.onLine ) {
				throw {
					code: 'offline_error',
					message: __(
						'Unable to connect. Please check your Internet connection.'
					),
				};
			}

			// Hard to diagnose further due to how Window.fetch reports errors.
			throw {
				code: 'fetch_error',
				message: __(
					'Could not get a valid response from the server.'
				),
			};
		}
	);
};

let fetchHandler = defaultFetchHandler;

/**
 * Defines a custom fetch handler for making the requests that will override
 * the default one using window.fetch
 *
 * @param newFetchHandler The new fetch handler
 */
function setFetchHandler( newFetchHandler: FetchHandler ) {
	fetchHandler = newFetchHandler;
}

export interface ApiFetch {
	< T, Parse extends boolean = true >(
		options: APIFetchOptions< Parse >
	): Promise< Parse extends true ? T : Response >;
	nonceEndpoint?: string;
	nonceMiddleware?: ReturnType< typeof createNonceMiddleware >;
	use: ( middleware: APIFetchMiddleware ) => void;
	setFetchHandler: ( newFetchHandler: FetchHandler ) => void;
	createNonceMiddleware: typeof createNonceMiddleware;
	createPreloadingMiddleware: typeof createPreloadingMiddleware;
	createRootURLMiddleware: typeof createRootURLMiddleware;
	fetchAllMiddleware: typeof fetchAllMiddleware;
	mediaUploadMiddleware: typeof mediaUploadMiddleware;
	createThemePreviewMiddleware: typeof createThemePreviewMiddleware;
}

/**
 * Fetch
 *
 * @param options The options for the fetch.
 * @return A promise representing the request processed via the registered middlewares.
 */
export const apiFetch: ApiFetch = ( options ) => {
	// creates a nested function chain that calls all middlewares and finally the `fetchHandler`,
	// converting `middlewares = [ m1, m2, m3 ]` into:
	// ```
	// opts1 => m1( opts1, opts2 => m2( opts2, opts3 => m3( opts3, fetchHandler ) ) );
	// ```
	const enhancedHandler = middlewares.reduceRight< FetchHandler >(
		( next, middleware ) => {
			return ( workingOptions ) => middleware( workingOptions, next );
		},
		fetchHandler
	);

	return enhancedHandler( options ).catch( ( error ) => {
		if ( error.code !== 'rest_cookie_invalid_nonce' ) {
			return Promise.reject( error );
		}

		// If the nonce is invalid, refresh it and try again.
		return globalThis
			.fetch( apiFetch.nonceEndpoint! )
			.then( ( response ) => {
				// If the nonce refresh fails, it means we failed to recover from the original
				// `rest_cookie_invalid_nonce` error and that it's time to finally re-throw it.
				if ( ! response.ok ) {
					return Promise.reject( error );
				}

				return response.text();
			} )
			.then( ( text ) => {
				apiFetch.nonceMiddleware!.nonce = text;
				return apiFetch( options );
			} );
	} );
};

apiFetch.use = registerMiddleware;
apiFetch.setFetchHandler = setFetchHandler;

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;
apiFetch.fetchAllMiddleware = fetchAllMiddleware;
apiFetch.mediaUploadMiddleware = mediaUploadMiddleware;
apiFetch.createThemePreviewMiddleware = createThemePreviewMiddleware;

export default apiFetch;
export type * from './types';
