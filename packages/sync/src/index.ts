/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { connectIndexDb } from './connect-indexdb';
import { createWebRTCConnection } from './create-webrtc-connection';
import { SyncProvider } from './provider';

/**
 * Exported copy of Yjs so that consumers of this package don't need to install it.
 */
export * as Y from 'yjs';

export { CRDT_RECORD_MAP_KEY } from './config';
export { SyncProvider } from './provider';
export * from './types';

declare global {
	interface Window {
		__experimentalCollaborativeEditingSecret?: string;
		wp: {
			ajax: {
				settings: {
					url: string;
				};
			};
		};
	}
}

/**
 * Returns a WebRTC sync provider. This is the curent default sync provider.
 *
 * @return {SyncProvider} The WebRTC sync provider.
 */
export function getWebRTCSyncProvider(): SyncProvider {
	return new SyncProvider( [
		connectIndexDb,
		createWebRTCConnection( {
			password: window?.__experimentalCollaborativeEditingSecret,
			signaling: [
				//'ws://localhost:4444',
				window?.wp?.ajax?.settings?.url,
			],
		} ),
	] );
}
