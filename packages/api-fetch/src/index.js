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

function checkCloudflareError( error ) {
	if ( typeof error === 'string' && error.indexOf( 'Cloudflare Ray ID' ) >= 0 ) {
		throw {
			code: 'cloudflare_error',
		};
	}
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

				/*
				 * Response data is a stream, which will be consumed by the .json() call.
				 * If we need to re-use this data to send to the Cloudflare error handler,
				 * we need a clone of the original response, so the stream can be consumed
				 * in the .text() call, instead.
				 */
				const responseClone = response.clone();

				return response.json()
					.catch( async () => {
						const text = await responseClone.text();
						checkCloudflareError( text );
						throw invalidJsonError;
					} )
					.then( ( error ) => {
						const unknownError = {
							code: 'unknown_error',
							message: __( 'An unknown error occurred.' ),
						};

						checkCloudflareError( error );

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
