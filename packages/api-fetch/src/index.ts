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

/**
 * Checks the status of a response, throwing the Response as an error if
 * it is outside the 200 range.
 *
 * @param response
 * @return The response if the status is in the 200 range.
 */
const checkStatus = ( response: Response ) => {
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	throw response;
};

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
				message: __( 'You are probably offline.' ),
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

interface apiFetch {
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
const apiFetch: apiFetch = ( options ) => {
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
		return window
			.fetch( apiFetch.nonceEndpoint! )
			.then( checkStatus )
			.then( ( data ) => data.text() )
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
export * from './types';
