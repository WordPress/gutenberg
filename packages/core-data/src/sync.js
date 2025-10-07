/**
 * WordPress dependencies
 */
import {
	connectIndexDb,
	createWebRTCConnection,
	SyncProvider,
} from '@wordpress/sync';

let syncProvider;

export function getSyncProvider() {
	if ( ! syncProvider ) {
		syncProvider = new SyncProvider( [
			connectIndexDb,
			createWebRTCConnection( {
				signaling: [
					//'ws://localhost:4444',
					window?.wp?.ajax?.settings?.url,
				],
				password: window?.__experimentalCollaborativeEditingSecret,
			} ),
		] );
	}

	return syncProvider;
}
