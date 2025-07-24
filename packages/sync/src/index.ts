/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { connectIndexDb } from './connect-indexdb';
import { createWebRTCConnection } from './create-webrtc-connection';
import { createSyncProvider } from './provider';
import type { SyncProvider } from './types';

export { connectIndexDb } from './connect-indexdb';
export { createWebRTCConnection } from './create-webrtc-connection';
export { createSyncProvider } from './provider';
export * from './types';

addFilter(
	'core.getSyncProvider',
	'wordpress-sync-webrtc/get-sync-provider',
	( provider: SyncProvider | null ): SyncProvider => {
		// Do not override an already defined sync provider.
		if ( provider ) {
			return provider;
		}

		return createSyncProvider(
			connectIndexDb,
			createWebRTCConnection( {
				password: window?.__experimentalCollaborativeEditingSecret,
				signaling: [
					//'ws://localhost:4444',
					window?.wp?.ajax?.settings?.url,
				],
			} )
		);
	},
	10
);
