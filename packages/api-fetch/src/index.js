/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

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
			if ( parse ) {
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

						if ( error.indexOf( 'Cloudflare Ray ID' ) >= 0 ) {
							window.location.href = addQueryArgs(
								window.location.href,
								{
									'classic-editor': '',
									'cloudflare-error': '',
								}
							);
						}

						throw error || unknownError;
					} );
			} );
	};

	const steps = [
		raw,
		httpV1Middleware,
		namespaceEndpointMiddleware,
		...middlewares,
	];
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
