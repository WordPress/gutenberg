/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Calls the `json` function on the Response, throwing an error if the response
 * doesn't have a json function or if parsing the json itself fails.
 *
 * @param response
 * @return Parsed response.
 */
async function parseJsonAndNormalizeError( response: Response ) {
	try {
		return await response.json();
	} catch {
		throw {
			code: 'invalid_json',
			message: __( 'The response is not a valid JSON response.' ),
		};
	}
}

/**
 * Parses the apiFetch response properly and normalize response errors.
 *
 * @param response
 * @param shouldParseResponse
 *
 * @return Parsed response.
 */
export async function parseResponseAndNormalizeError(
	response: Response,
	shouldParseResponse = true
) {
	if ( ! shouldParseResponse ) {
		return response;
	}

	if ( response.status === 204 ) {
		return null;
	}

	return await parseJsonAndNormalizeError( response );
}

/**
 * Parses a response, throwing an error if parsing the response fails.
 *
 * @param response
 * @param shouldParseResponse
 * @return Never returns, always throws.
 */
export async function parseAndThrowError(
	response: Response,
	shouldParseResponse = true
) {
	if ( ! shouldParseResponse ) {
		throw response;
	}

	// Parse the response JSON and throw it as an error.
	throw await parseJsonAndNormalizeError( response );
}
