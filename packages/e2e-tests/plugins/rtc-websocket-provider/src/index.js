/**
 * Test-only WebSocket sync provider for Gutenberg RTC e2e tests.
 *
 * Speaks the y-websocket binary protocol against test/e2e/bin/rtc-test-ws-sync-server.mjs
 * (which is built on @y/websocket-server) so the test harness exercises the same
 * wire format as production deployments. Exposes a small debug surface on
 * window.__gutenbergTestWebSocketSync.rooms that the Playwright fixtures poll.
 */

// eslint-disable-next-line import/no-extraneous-dependencies -- declared in test/e2e/package.json, only loaded by the WS e2e harness.
import { WebsocketProvider } from 'y-websocket';

const TEST_PROVIDER_NAMESPACE = 'gutenberg-test/rtc-websocket-provider';
const DEFAULT_URL = 'ws://127.0.0.1:18991';
const HAS_PROVIDER_SYNCED_REMOTE_STATE_META = 'hasProviderSyncedRemoteState';

const settings = window.gutenbergTestWebSocketSync || {};
const globalState = ( window.__gutenbergTestWebSocketSync = {
	rooms: {},
	tick: 0,
	url: settings.url || DEFAULT_URL,
} );

function ensureRoomDebugState( room ) {
	if ( ! globalState.rooms[ room ] ) {
		globalState.rooms[ room ] = {
			awarenessCount: 0,
			clientId: null,
			status: 'disconnected',
			synced: false,
		};
	}
	return globalState.rooms[ room ];
}

function updateDebugState( room, patch ) {
	Object.assign( ensureRoomDebugState( room ), patch );
	globalState.tick += 1;
}

function areUint8ArraysEqual( a, b ) {
	if ( a.length !== b.length ) {
		return false;
	}

	return a.every( ( value, index ) => value === b[ index ] );
}

function createWebSocketProvider() {
	return async ( { awareness, objectType, objectId, ydoc } ) => {
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;
		const initialStateVector = window.wp.sync.Y.encodeStateVector( ydoc );
		let resolveInitialSync;
		const initialSync = new Promise( ( resolve ) => {
			resolveInitialSync = resolve;
		} );

		updateDebugState( room, {
			clientId: ydoc.clientID,
			status: 'connecting',
			synced: false,
		} );

		const provider = new WebsocketProvider( globalState.url, room, ydoc, {
			awareness,
			// Disable BroadcastChannel so cross-tab sync always goes through
			// the WebSocket. Tests need to exercise the wire transport.
			disableBc: true,
		} );

		const statusListeners = new Set();

		const onStatus = ( event ) => {
			// A fresh socket means the previous sync handshake (if any) is
			// no longer current. y-websocket re-fires 'sync' once sync step 2
			// completes on the new connection.
			const patch = { status: event.status };
			if ( event.status !== 'connected' ) {
				patch.synced = false;
			}
			updateDebugState( room, patch );
			for ( const callback of statusListeners ) {
				callback( { status: event.status } );
			}
		};
		provider.on( 'status', onStatus );

		// y-websocket distinguishes socket connection from sync completion.
		// 'connected' means the WS is open; 'sync' fires once sync step 2 has
		// landed and the doc reflects the server state. Tests that need real
		// convergence should wait on `synced`, not just `status`.
		const onSync = ( isSynced ) => {
			if ( isSynced ) {
				const currentStateVector =
					window.wp.sync.Y.encodeStateVector( ydoc );

				if (
					! areUint8ArraysEqual(
						currentStateVector,
						initialStateVector
					)
				) {
					ydoc.meta.set(
						HAS_PROVIDER_SYNCED_REMOTE_STATE_META,
						true
					);
				}

				resolveInitialSync();
			}
			updateDebugState( room, { synced: !! isSynced } );
		};
		provider.on( 'sync', onSync );

		const onAwarenessChange = () => {
			updateDebugState( room, {
				awarenessCount: ( awareness || provider.awareness ).getStates()
					.size,
			} );
		};
		const awarenessInstance = awareness || provider.awareness;
		awarenessInstance.on( 'change', onAwarenessChange );
		onAwarenessChange();

		await initialSync;

		return {
			destroy: () => {
				awarenessInstance.off( 'change', onAwarenessChange );
				provider.off( 'status', onStatus );
				provider.off( 'sync', onSync );
				provider.destroy();
				updateDebugState( room, {
					status: 'disconnected',
					synced: false,
				} );
			},
			on: ( event, callback ) => {
				if ( event === 'status' ) {
					statusListeners.add( callback );
					callback( {
						status: ensureRoomDebugState( room ).status,
					} );
				}
			},
		};
	};
}

window.wp.hooks.addFilter( 'sync.providers', TEST_PROVIDER_NAMESPACE, () => [
	createWebSocketProvider(),
] );
