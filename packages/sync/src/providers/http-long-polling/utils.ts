/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { SyncPayload, SyncResponse } from '../common/types';

const LONG_POLL_API_PATH = '/wp-sync/v1/long-poll';

/**
 * Post a sync payload to the long-poll endpoint. The server holds the
 * request open (up to its wait budget) when there is nothing to deliver.
 *
 * @param payload The sync payload including data and after cursor
 * @param signal  Abort signal so a held request can be cancelled when
 *                local updates need to be sent immediately.
 * @return The sync server response
 */
export function postLongPollSyncUpdate(
	payload: SyncPayload,
	signal?: AbortSignal
): Promise< SyncResponse > {
	return apiFetch( {
		method: 'POST',
		path: LONG_POLL_API_PATH,
		data: payload,
		signal,
	} );
}

/**
 * Check whether a caught error is a fetch abort.
 *
 * @param error The caught error to inspect.
 */
export function isAbortError( error: unknown ): boolean {
	return (
		error instanceof Error &&
		( error.name === 'AbortError' ||
			( error as DOMException ).code === DOMException.ABORT_ERR )
	);
}
