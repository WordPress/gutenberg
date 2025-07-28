/**
 * WordPress dependencies
 */

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

/**
 * Returns a WebRTC sync provider. This is the curent default sync provider.
 *
 * @return {SyncProvider} The WebRTC sync provider.
 */
export function getWebRTCSyncProvider(): SyncProvider {
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
}
