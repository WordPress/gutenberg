/**
 * WordPress dependencies
 */
import {
	createSyncProvider,
	connectIndexDb,
	createWebRTCConnection,
} from '@wordpress/sync';

let syncProvider;

export function getSyncProvider() {
	if ( ! syncProvider ) {
		syncProvider = createSyncProvider(
			connectIndexDb,
			createWebRTCConnection( {
				signaling: [
					//'ws://localhost:4444',
					window?.wp?.ajax?.settings?.url,
				],
				password: window?.__experimentalCollaborativeEditingSecret,
			} )
		);
	}

	return syncProvider;
}
