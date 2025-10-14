/**
 * WordPress dependencies
 */
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
	createSyncManager,
} from '@wordpress/sync';

export {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_SYNC_MANAGER_ORIGIN,
};
export const syncManager = createSyncManager();
