import { __, sprintf } from '@wordpress/i18n';

/**
 * `apiFetch` rejection codes that say nothing about what actually went wrong.
 *
 * Both are produced when the response body could not be read as a REST error:
 * `invalid_json` when it is not JSON at all (a PHP fatal, a proxy error page,
 * a truncated response), and `unknown_error` when it parses to nothing. The
 * request failed on the server in every one of those cases, so the code is an
 * implementation detail rather than something worth showing a user.
 */
const OPAQUE_ERROR_CODES = [ 'invalid_json', 'unknown_error' ];

/**
 * Builds the message shown when an upload request fails.
 *
 * `@wordpress/api-fetch` rejects with whatever the failing layer produced: a
 * plain `{ code, message }` object for REST errors, the `Response` itself when
 * the caller opted out of parsing, or an `Error`. Only a genuine REST error
 * carries a message written for a human, so everything else is reported as the
 * server-side failure it is.
 *
 * @param error    The value the upload request rejected with.
 * @param fileName Name of the file that failed to upload.
 * @return A message describing the failure.
 */
export function getUploadErrorMessage(
	error: unknown,
	fileName: string
): string {
	/*
	 * Kept identical to the `GENERAL` entry of `getErrorMessage()` in
	 * `@wordpress/upload-media`, so the same failure reads the same way
	 * wherever it surfaces.
	 */
	const serverError = sprintf(
		/* translators: %s: file name */
		__( 'Failed to upload "%s". Please try again.' ),
		fileName
	);

	if ( typeof error === 'string' ) {
		return error || serverError;
	}

	/*
	 * Everything else is read by duck typing, because the rejection is not
	 * necessarily an `Error`. A `Response` (what `parse: false` rejects with)
	 * carries a status and no message, so it falls through to `serverError`.
	 */
	const { code, message } = ( error ?? {} ) as {
		code?: unknown;
		message?: unknown;
	};

	if ( typeof code === 'string' && OPAQUE_ERROR_CODES.includes( code ) ) {
		return serverError;
	}

	return typeof message === 'string' && message ? message : serverError;
}
