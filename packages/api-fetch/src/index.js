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

const middlewares = [];

function registerMiddleware( middleware ) {
	middlewares.push( middleware );
}

function apiFetch( options ) {
	const raw = ( nextOptions ) => {
		const { url, path, body, data, parse = true, ...remainingOptions } = nextOptions;
		const headers = {
			Accept: 'application/json, */*;q=0.1',
			'Content-Type': 'application/json',
			...remainingOptions.headers,
		};

		const responsePromise = window.fetch(
			url || path,
			{
				...remainingOptions,
				credentials: 'include',
				body: body || JSON.stringify( data ),
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

	const steps = [
		raw,
		fetchAllMiddleware,
		httpV1Middleware,
		namespaceEndpointMiddleware,
		userLocaleMiddleware,
		...middlewares,
	].reverse();

	const runMiddleware = ( index ) => ( nextOptions ) => {
		const nextMiddleware = steps[ index ];
		const next = runMiddleware( index + 1 );
		return nextMiddleware( nextOptions, next );
	};

	return runMiddleware( 0 )( options );
}

apiFetch.use = registerMiddleware;

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;
apiFetch.fetchAllMiddleware = fetchAllMiddleware;

export default apiFetch;
