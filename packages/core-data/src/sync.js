/**
 * WordPress dependencies
 */
import { createSyncProvider, connectIndexDb } from '@wordpress/sync';

let syncProvider;
export function getSyncProvider() {
	if ( ! syncProvider ) {
		syncProvider = createSyncProvider( connectIndexDb );
	}

	return syncProvider;
}
