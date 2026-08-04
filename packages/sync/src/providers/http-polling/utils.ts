/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { SyncPayload, SyncResponse } from './types';

/**
 * Transport-agnostic helpers are shared across providers and live in
 * `../common/utils`. They are re-exported here to keep the http-polling
 * provider's public surface stable.
 */
export {
	base64ToUint8Array,
	createSyncUpdate,
	createUpdateQueue,
	intValueOrDefault,
	rotateWindow,
	uint8ArrayToBase64,
} from '../common/utils';

const SYNC_API_PATH = '/wp-sync/v1/updates';

/**
 * Post a sync update and receive updates the client is missing.
 *
 * @param payload The sync payload including data and after cursor
 * @return The sync server response
 */
export function postSyncUpdate(
	payload: SyncPayload
): Promise< SyncResponse > {
	return apiFetch( {
		method: 'POST',
		path: SYNC_API_PATH,
		data: payload,
	} );
}

/**
 * Fire-and-forget variant of postSyncUpdate. Uses `keepalive` so the
 * request survives page unload, and errors are silently ignored.
 *
 * @param payload The sync payload to send.
 */
export function postSyncUpdateNonBlocking( payload: SyncPayload ): void {
	if ( payload.rooms.length === 0 ) {
		return;
	}

	apiFetch( {
		method: 'POST',
		path: SYNC_API_PATH,
		data: payload,
		keepalive: true,
	} ).catch( () => {} );
}
