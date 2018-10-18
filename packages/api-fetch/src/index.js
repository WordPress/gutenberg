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

function parseResponse( response, parse = true ) {
	if ( parse ) {
		return response.json ? response.json() : Promise.reject( response );
	}

	return response;
}

function apiFetch( options ) {
	const raw = ( nextOptions ) => {
		const { url, path, body, data, parse, ...remainingOptions } = nextOptions;
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

		return responsePromise
			.then( checkStatus )
			.then( ( response ) => parseResponse( response, parse ) )
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

const capPerPageQuery = ( options ) => ( {
	...options,
	// Swap back to requesting the max of 100 items per page.
	// TODO: This feels brittle. Is there a better way to manage request parameters?
	path: options.path && `${ options.path.replace( /(\&?per_page)=-1/, '$1=100' ) }&page=1`,
	url: options.url && `${ options.url.replace( /(\&?per_page)=-1/, '$1=100' ) }&page=1`,
} );

const setRequestedPage = ( options, page ) => ( {
	...options,
	path: options.path && options.path.replace( '&page=1', `&page=${ page }` ),
	url: options.url && options.url.replace( '&page=1', `&page=${ page }` ),
} );

// The REST API enforces an upper limit of 100 on the per_page option. To handle
// large collections, apiFetch consumers can pass `per_page=-1` and this middleware
// function will recursively assemble a full response by paging over all available
// pages of API data.
const fetchAllMiddleware = async ( options, next ) => {
	try {
		if ( options.url && options.url.indexOf( 'per_page=-1' ) < 0 ) {
			return next( options );
		}

		const pageOptions = capPerPageQuery( options );
		const pageOneResults = await next( {
			...pageOptions,
			// Ensure headers are returned for page 1.
			parse: false,
		} );
		const pageOneParsed = await parseResponse( pageOneResults, options.parse );

		const totalPages = pageOneResults.headers && pageOneResults.headers.get( 'X-WP-TotalPages' );

		// Build an array of options objects for each remaining page.
		const remainingPageRequests = Array.from( {
			length: totalPages - 1,
		} ).map( ( _, idx ) => {
			// Specify the page to request. First additional request is index 0 but page 2, etc.
			// Build these URLs based on pageOptions to avoid repeating the per_page adjustment.
			return setRequestedPage( pageOptions, idx + 2 );
		} );

		return remainingPageRequests.reduce(
			// Request each remaining page in sequence, and return a merged array.
			async ( previousPageRequest, nextPageOptions ) => {
				const resultsCollection = await previousPageRequest;
				const nextPage = await apiFetch( nextPageOptions );
				return resultsCollection.concat( nextPage );
			},
			// Ensure that the first page is parsed properly, as specified in the original options.
			[].concat( pageOneParsed )
		);
	} catch ( e ) {
		return Promise.reject( e );
	}
};

apiFetch.use( fetchAllMiddleware );

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;

export default apiFetch;
