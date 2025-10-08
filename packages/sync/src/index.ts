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
export type * from './types';

/**
 * Returns a WebRTC sync provider. This is the current default sync provider.
 *
 * @return {SyncProvider|null} The WebRTC sync provider.
 */
export function getWebRTCSyncProvider(): SyncProvider | null {
	const signalingUrl = window?.wp?.ajax?.settings?.url;

	if ( ! signalingUrl ) {
		return null;
	}

	return new SyncProvider( [
		connectIndexDb,
		createWebRTCConnection( {
			password: window?.__experimentalCollaborativeEditingSecret,
			signaling: [ signalingUrl ],
		} ),
	] );
}
