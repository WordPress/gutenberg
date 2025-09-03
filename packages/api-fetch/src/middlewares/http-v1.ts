/**
 * Internal dependencies
 */
import type { APIFetchMiddleware } from '../types';

/**
 * Set of HTTP methods which are eligible to be overridden.
 */
const OVERRIDE_METHODS = new Set( [ 'PATCH', 'PUT', 'DELETE' ] );

/**
 * Default request method.
 *
 * "A request has an associated method (a method). Unless stated otherwise it
 * is `GET`."
 *
 * @see  https://fetch.spec.whatwg.org/#requests
 */
const DEFAULT_METHOD = 'GET';

/**
 * API Fetch middleware which overrides the request method for HTTP v1
 * compatibility leveraging the REST API X-HTTP-Method-Override header.
 *
 * @param options
 * @param next
 */
const httpV1Middleware: APIFetchMiddleware = ( options, next ) => {
	const { method = DEFAULT_METHOD } = options;
	if ( OVERRIDE_METHODS.has( method.toUpperCase() ) ) {
		options = {
			...options,
			headers: {
				...options.headers,
				'X-HTTP-Method-Override': method,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		};
	}

	return next( options );
};

export default httpV1Middleware;
