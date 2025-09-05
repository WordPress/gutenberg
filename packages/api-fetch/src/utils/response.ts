/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Parses the apiFetch response.
 *
 * @param response
 * @param shouldParseResponse
 *
 * @return Parsed response.
 */
const parseResponse = ( response: Response, shouldParseResponse = true ) => {
	if ( shouldParseResponse ) {
		if ( response.status === 204 ) {
			return null;
		}

		return response.json ? response.json() : Promise.reject( response );
	}

	return response;
};

/**
 * Calls the `json` function on the Response, throwing an error if the response
 * doesn't have a json function or if parsing the json itself fails.
 *
 * @param response
 * @return Parsed response.
 */
const parseJsonAndNormalizeError = ( response: Response ) => {
	const invalidJsonError = {
		code: 'invalid_json',
		message: __( 'The response is not a valid JSON response.' ),
	};

	if ( ! response || ! response.json ) {
		throw invalidJsonError;
	}

	return response.json().catch( () => {
		throw invalidJsonError;
	} );
};

/**
 * Parses the apiFetch response properly and normalize response errors.
 *
 * @param response
 * @param shouldParseResponse
 *
 * @return Parsed response.
 */
export const parseResponseAndNormalizeError = (
	response: Response,
	shouldParseResponse = true
) => {
	return Promise.resolve(
		parseResponse( response, shouldParseResponse )
	).catch( ( res ) => parseAndThrowError( res, shouldParseResponse ) );
};

/**
 * Parses a response, throwing an error if parsing the response fails.
 *
 * @param response
 * @param shouldParseResponse
 * @return Parsed response.
 */
export function parseAndThrowError(
	response: Response,
	shouldParseResponse = true
) {
	if ( ! shouldParseResponse ) {
		throw response;
	}

	return parseJsonAndNormalizeError( response ).then( ( error ) => {
		const unknownError = {
			code: 'unknown_error',
			message: __( 'An unknown error occurred.' ),
		};

		throw error || unknownError;
	} );
}
