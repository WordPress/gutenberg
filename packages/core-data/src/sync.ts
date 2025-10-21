/**
 * WordPress dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
	type SyncManager,
	createSyncManager,
} from '@wordpress/sync';

export { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN, LOCAL_SYNC_MANAGER_ORIGIN };

let syncManager: SyncManager;

export function getSyncManager(): SyncManager | undefined {
	if ( syncManager ) {
		return syncManager;
	}

	syncManager = createSyncManager();

	return syncManager;
}
