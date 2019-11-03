/**
 * External dependencies
 */
import fetch from 'node-fetch';

/**
 * Internal dependencies
 */
import { getJSONResponse } from '../shared/get-json-response';

/**
 * Mocks a request with the supplied mock object, or allows it to run with an optional transform, based on the
 * deserialised JSON response for the request.
 *
 * @param {Function} mockCheck function that returns true if the request should be mocked.
 * @param {Object} mock A mock object to wrap in a JSON response, if the request should be mocked.
 * @param {Function|undefined} responseObjectTransform An optional function that transforms the response's object before the response is used.
 * @return {Promise} Promise that uses `mockCheck` to see if a request should be mocked with `mock`, and optionally transforms the response with `responseObjectTransform`.
 */
export function mockOrTransform(
	mockCheck,
	mock,
	responseObjectTransform = ( obj ) => obj
) {
	return async ( request ) => {
		// Because we can't get the responses to requests and modify them on the fly,
		// we have to make our own request and get the response, then apply the
		// optional transform to the json encoded object.
		const response = await fetch( request.url(), {
			headers: request.headers(),
			method: request.method(),
			body: request.postData(),
		} );
		const responseObject = await response.json();
		if ( mockCheck( responseObject ) ) {
			request.respond( getJSONResponse( mock ) );
		} else {
			request.respond( getJSONResponse( responseObjectTransform( responseObject ) ) );
		}
	};
}
