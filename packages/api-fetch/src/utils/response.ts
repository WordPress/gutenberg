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
			...getResponseData( response ),
		};
	}
}

/**
 * Returns the response's status, and the address it was redirected to, in the
 * shape of a REST error's `data`.
 *
 * @param response
 * @return Object with a `data` property, or an empty object.
 */
function getResponseData( response: Response ) {
	if ( typeof response.status !== 'number' ) {
		return {};
	}
	return {
		data: {
			status: response.status,
			...( response.redirected && { url: response.url } ),
		},
	};
}

/**
 * Returns whether a value is an object other than an array.
 *
 * @param value
 * @return Whether the value is a plain object.
 */
function isPlainObject( value: unknown ): value is Record< string, any > {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
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
	const error = await parseJsonAndNormalizeError( response );

	// Like WordPress's own REST errors, an error carries the status in `data`.
	if (
		isPlainObject( error ) &&
		( error.data === undefined || isPlainObject( error.data ) ) &&
		error.data?.status === undefined &&
		typeof response.status === 'number'
	) {
		throw { ...error, data: { ...error.data, status: response.status } };
	}
	throw error;
}
