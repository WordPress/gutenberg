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

/**
 * Default set of header values which should be sent with every request unless
 * explicitly provided through apiFetch options.
 *
 * @type {Object}
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

const middlewares = [
	userLocaleMiddleware,
	namespaceEndpointMiddleware,
	httpV1Middleware,
	fetchAllMiddleware,
];

function registerMiddleware( middleware ) {
	middlewares.unshift( middleware );
}

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
		url || path,
		{
			...DEFAULT_OPTIONS,
			...remainingOptions,
			body,
			headers,
		}
	);
	const checkStatus = ( response ) => {
		if ( response.status >= 200 && response.status < 300 ) {
			return response;
		}

		throw response;
	};

	const parseResponse = ( response ) => {
		if ( parse ) {
			if ( response.status === 204 ) {
				return null;
			}

			return response.json ? response.json() : Promise.reject( response );
		}

		return response;
	};

	return responsePromise
		.then( checkStatus )
		.then( parseResponse )
		.catch( ( response ) => {
			if ( ! parse ) {
				throw response;
			}

			const invalidJsonError = {
				code: 'invalid_json',
				message: __( 'The response is not a valid JSON response.' ),
			};

			if ( ! response || ! response.json ) {
				throw invalidJsonError;
			}

			return response.json()
				.catch( () => {
					throw invalidJsonError;
				} )
				.then( ( error ) => {
					const unknownError = {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					};

					throw error || unknownError;
				} );
		} );
};

let fetchHandler = defaultFetchHandler;

/**
 * Defines a custom fetch handler for making the requests that will override
 * the default one using window.fetch
 *
 * @param {Function} newFetchHandler The new fetch handler
 */
function setFetchHandler( newFetchHandler ) {
	fetchHandler = newFetchHandler;
}

function apiFetch( options ) {
	const steps = [ ...middlewares, fetchHandler ];

	const createRunStep = ( index ) => ( workingOptions ) => {
		const step = steps[ index ];
		if ( index === steps.length - 1 ) {
			return step( workingOptions );
		}

		const next = createRunStep( index + 1 );
		return step( workingOptions, next );
	};

	return createRunStep( 0 )( options );
}

apiFetch.use = registerMiddleware;
apiFetch.setFetchHandler = setFetchHandler;

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;
apiFetch.fetchAllMiddleware = fetchAllMiddleware;

export default apiFetch;
