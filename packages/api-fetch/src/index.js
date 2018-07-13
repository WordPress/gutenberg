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
import namespaceEndpointMiddleware from './middlewares/namespace-endpoint';
import httpV1Middleware from './middlewares/http-v1';

const middlewares = [];

function registerMiddleware( middleware ) {
	middlewares.push( middleware );
}

function apiFetch( options ) {
	const raw = ( nextOptions ) => {
		const { url, path, body, data, parse = true, ...remainingOptions } = nextOptions;
		const headers = remainingOptions.headers || {};
		if ( ! headers[ 'Content-Type' ] && data ) {
			headers[ 'Content-Type' ] = 'application/json';
		}

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
			return parse ? response.json() : response;
		};

		return responsePromise
			.then( checkStatus )
			.then( parseResponse )
			.catch( ( response ) => {
				if ( ! parse ) {
					Promise.reject( response );
				}

				return response.json()
					.then( ( error ) => {
						const unknownError = {
							code: 'unknown_error',
							message: __( 'An unknown error occurred.' ),
						};

						return Promise.reject( error || unknownError );
					} )
					.catch( () => {
						return Promise.reject( {
							code: 'invalid_json',
							message: __( 'The response is not a valid JSON response.' ),
						} );
					} );
			} );
	};
	const steps = [
		...middlewares,
		namespaceEndpointMiddleware,
		httpV1Middleware,
		raw,
	].reverse();
	const next = ( nextOptions ) => {
		const nextMiddleware = steps.pop();
		return nextMiddleware( nextOptions, next );
	};

	return next( options );
}

apiFetch.use = registerMiddleware;

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;

export default apiFetch;
