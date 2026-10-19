import { __ } from '@wordpress/i18n';

/**
 * Reads the response body as JSON, normalizing a parse failure into an
 * `invalid_json` error.
 *
 * The error keeps the response's `status` and whether it was `redirected`,
 * since they are often the only account of what answered instead of
 * WordPress: an error page from a proxy, or the login page. They are top-level
 * rather than in `data`, where a REST error keeps the status WordPress set.
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
			// Response-likes from a custom fetch handler may lack either.
			...( typeof response.status === 'number' && {
				status: response.status,
			} ),
			...( typeof response.redirected === 'boolean' && {
				redirected: response.redirected,
			} ),
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
