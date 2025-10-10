/**
 * WordPress dependencies
 */
import {
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	createSyncManager,
} from '@wordpress/sync';

export { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN };
export const syncManager = createSyncManager();
