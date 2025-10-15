/**
 * WordPress dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
	createSyncManager,
} from '@wordpress/sync';

export { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN, LOCAL_SYNC_MANAGER_ORIGIN };
export const syncManager = createSyncManager();
