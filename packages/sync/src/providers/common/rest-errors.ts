/**
 * Minimal shape of a WordPress REST API error as it arrives on the client
 * via apiFetch. WP_Error is serialized to JSON with a `data.status` field
 * containing the HTTP status code; `code` and `message` are best-effort.
 */
export interface WPRestError {
	code?: string;
	message?: string;
	data: { status: number; rooms?: string[] };
}

/**
 * Check if an error is a forbidden (403) response from the WordPress REST
 * API. These errors have a `data.status` property set by WP_Error.
 *
 * @param error The caught error to inspect.
 */
export function isForbiddenError( error: unknown ): error is WPRestError {
	return ( error as WPRestError | undefined )?.data?.status === 403;
}

/**
 * Check if an error is the sync server's deterministic request-body-size
 * rejection. The server rejects this before the sync handler stores updates, so
 * the client can safely retry the exact same updates in smaller request bodies.
 *
 * @param error The caught error to inspect.
 */
export function isRequestBodyTooLargeError(
	error: unknown
): error is WPRestError {
	return (
		( error as WPRestError | undefined )?.data?.status === 413 &&
		( error as WPRestError | undefined )?.code ===
			'rest_sync_body_too_large'
	);
}

/**
 * Check if an error is the sync server's protocol mismatch signal. This
 * indicates the client is running an outdated version of the code that is
 * incompatible with the server, and the user should refresh to recover.
 *
 * @param error The caught error to inspect.
 */
export function isProtocolMismatchError(
	error: unknown
): error is WPRestError {
	return (
		( error as WPRestError | undefined )?.code ===
		'rest_sync_protocol_mismatch'
	);
}
