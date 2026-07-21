/**
 * Test-only WebSocket sync provider for Gutenberg RTC e2e tests.
 *
 * Speaks the y-websocket binary protocol against test/e2e/bin/rtc-test-ws-sync-server.mjs
 * (which is built on @y/websocket-server) so the test harness exercises the same
 * wire format as production deployments. Exposes a small debug surface on
 * window.__gutenbergTestWebSocketSync.rooms that the Playwright fixtures poll.
 */

import { WebsocketProvider } from 'y-websocket';

const TEST_PROVIDER_NAMESPACE = 'gutenberg-test/rtc-websocket-provider';
const DEFAULT_URL = 'ws://127.0.0.1:18991';

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

function createWebSocketProvider() {
	return async ( { awareness, objectType, objectId, ydoc } ) => {
		const room = objectId ? `${ objectType }:${ objectId }` : objectType;

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

		// y-websocket distinguishes socket connection from sync completion.
		// 'connected' means the WS is open; 'sync' fires once sync step 2 has
		// landed and the doc reflects the server state. Tests that need real
		// convergence should wait on `synced`, not just `status`. Reported
		// statuses include the optional `isSynced` field so that consumers
		// (e.g. the editor's autosave notice) can act as soon as the initial
		// document sync has been applied.
		let rawStatus = 'connecting';
		let isSynced = false;

		const notifyStatus = () => {
			const status = { status: rawStatus };
			if ( 'connected' === rawStatus ) {
				status.isSynced = isSynced;
			}

			for ( const callback of statusListeners ) {
				callback( status );
			}
		};

		const onStatus = ( event ) => {
			// A fresh socket means the previous sync handshake (if any) is
			// no longer current. y-websocket re-fires 'sync' once sync step 2
			// completes on the new connection.
			rawStatus = event.status;
			if ( event.status !== 'connected' ) {
				isSynced = false;
			}
			updateDebugState( room, {
				status: event.status,
				synced: isSynced,
			} );
			notifyStatus();
		};
		provider.on( 'status', onStatus );

		const onSync = ( synced ) => {
			isSynced = !! synced;
			updateDebugState( room, { synced: isSynced } );
			notifyStatus();
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
				}
			},
		};
	};
}

window.wp.hooks.addFilter( 'sync.providers', TEST_PROVIDER_NAMESPACE, () => [
	createWebSocketProvider(),
] );
