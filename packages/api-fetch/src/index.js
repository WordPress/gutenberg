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
import { getNextLinkFromResponse } from './utils/header';
import {
	requestContainsUnboundedQuery,
	rewriteUnboundedQuery,
} from './utils/url';

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

/**
 * Wrapper for fetch which can handle status checks and recursive pagination.
 *
 * @param {Object} options Fetch options & data payload.
 * @return {Promise} A promise resolving to the response object, JSON, or an error.
 */
const customFetch = ( options ) => {
	const { url, path, body, data, parse = true, ...remainingOptions } = options;
	const headers = remainingOptions.headers || {};
	if ( ! headers[ 'Content-Type' ] && data ) {
		headers[ 'Content-Type' ] = 'application/json';
	}

	const responsePromise = window.fetch(
		rewriteUnboundedQuery( url || path ),
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

	const parseAndPaginate = async ( response ) => {
		if ( parse === false ) {
			return response;
		}

		if ( parse && ! response.json ) {
			throw response;
		}

		// Parse the response.
		const jsonResponse = await response.json();

		// If no pagination is requested, return the response directly.
		if ( ! requestContainsUnboundedQuery( url || path ) ) {
			return jsonResponse;
		}

		// Check response headers for the existence of a next page of results.
		const nextPage = getNextLinkFromResponse( response );

		if ( ! nextPage ) {
			// There are no further pages to request.
			return jsonResponse;
		}

		if ( ! Array.isArray( jsonResponse ) ) {
			// TODO: Identify a strategy for merging paginated non-array results.
			return jsonResponse;
		}

		// Recursively fetch & merge in the next page of results.
		return customFetch( {
			...remainingOptions,
			url: nextPage,
			body,
			data,
			parse,
		} ).then( ( results ) => jsonResponse.concat( results ) );
	};

	return responsePromise
		.then( checkStatus )
		.then( parseAndPaginate );
};

function apiFetch( options ) {
	const raw = ( nextOptions ) => {
		const { parse = true } = nextOptions;
		const responsePromise = customFetch( nextOptions );

		return responsePromise
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
