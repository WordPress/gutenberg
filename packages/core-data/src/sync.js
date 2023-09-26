/**
 * WordPress dependencies
 */
import {
	createSyncProvider,
	connectIndexDb,
	connectWebRTC,
} from '@wordpress/sync';

let syncProvider;

export function getSyncProvider() {
	if ( ! syncProvider ) {
		syncProvider = createSyncProvider( connectIndexDb, connectWebRTC );
	}

	return syncProvider;
}
