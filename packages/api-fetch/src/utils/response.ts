import { __ } from '@wordpress/i18n';

/**
 * Reads the response body as JSON, normalizing a parse failure into an
 * `invalid_json` error.
 *
 * Only the success path passes `allowEmptyBody`: `parseAndThrowError` throws
 * whatever this returns, and callers read `code` off it.
 *
 * @param response
 * @param allowEmptyBody Resolve an empty body to `null` instead of throwing.
 * @return Parsed response.
 */
async function parseJsonAndNormalizeError(
	response: Response,
	allowEmptyBody = false
) {
	try {
		// Response-likes without `text()` were always accepted here.
		if ( typeof response.text !== 'function' ) {
			return await response.json();
		}

		// Parsing the text here, rather than calling `json()`, keeps an empty
		// body distinguishable from invalid JSON without a `clone()`.
		const text = await response.text();
		if ( allowEmptyBody && text === '' ) {
			return null;
		}
		return JSON.parse( text );
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

	return await parseJsonAndNormalizeError( response, true );
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
