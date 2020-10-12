/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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

export const checkStatus = ( response ) => {
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	throw response;
};

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

	const responsePromise = window.fetch( url || path, {
		...DEFAULT_OPTIONS,
		...remainingOptions,
		body,
		headers,
	} );

	return (
		responsePromise
			// Return early if fetch errors. If fetch error, there is most likely no
			// network connection. Unfortunately fetch just throws a TypeError and
			// the message might depend on the browser.
			.then(
				( value ) =>
					Promise.resolve( value )
						.then( checkStatus )
						.catch( ( response ) =>
							parseAndThrowError( response, parse )
						)
						.then( ( response ) =>
							parseResponseAndNormalizeError( response, parse )
						),
				() => {
					throw {
						code: 'fetch_error',
						message: __( 'You are probably offline.' ),
					};
				}
			)
	);
};

let fetchHandler = defaultFetchHandler;
export function getFetchHandler() {
	return fetchHandler;
}

/**
 * Defines a custom fetch handler for making the requests that will override
 * the default one using window.fetch
 *
 * @param {Function} newFetchHandler The new fetch handler
 */
export function setFetchHandler( newFetchHandler ) {
	fetchHandler = newFetchHandler;
}
