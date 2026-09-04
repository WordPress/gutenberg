import { __ } from '@wordpress/i18n';

/**
 * Calls the `json` function on the Response, throwing an error if the response
 * doesn't have a json function or if parsing the json itself fails.
 *
 * @param response
 * @return Parsed response.
 */
async function parseJsonAndNormalizeError( response: Response ) {
	// Clone the response up front so that, should `json()` fail, the body can
	// still be read to distinguish an empty body from genuinely invalid JSON.
	const clone = response.clone?.();
	try {
		return await response.json();
	} catch {
		// A successful response can legitimately have an empty body (for
		// example, a `200` with no content), which is not valid JSON. Treat it
		// the same as a `204` rather than reporting an error.
		if ( clone && ( await clone.text() ) === '' ) {
			return null;
		}
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
