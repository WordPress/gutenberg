/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import type { Awareness } from 'y-protocols/awareness';
import { removeAwarenessStates } from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

/**
 * Internal dependencies
 */
import type { ConnectionStatus } from '../../types';
import {
	type AwarenessState,
	type LocalAwarenessState,
	type SyncPayload,
	type SyncUpdate,
	SyncUpdateType,
	type UpdateQueue,
} from './types';
import {
	base64ToUint8Array,
	createSyncUpdate,
	createUpdateQueue,
	postSyncUpdate,
	postSyncUpdateNonBlocking,
} from './utils';

const POLLING_INTERVAL_IN_MS = 1000; // 1 second or 1000 milliseconds
const POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS = 250; // 250 milliseconds
const POLLING_INTERVAL_BACKGROUND_TAB_IN_MS = 30 * 1000; // 30 seconds
const MAX_ERROR_BACKOFF_IN_MS = 30 * 1000; // 30 seconds
const POLLING_MANAGER_ORIGIN = 'polling-manager';

type LogFunction = ( message: string, debug?: object ) => void;

interface PollingManager {
	registerRoom: ( options: RegisterRoomOptions ) => void;
	unregisterRoom: ( room: string ) => void;
}

interface RegisterRoomOptions {
	room: string;
	doc: Y.Doc;
	awareness: Awareness;
	log: LogFunction;
	onStatusChange: ( status: ConnectionStatus ) => void;
	onSync: () => void;
}

interface RoomState {
	clientId: number;
	createCompactionUpdate: () => SyncUpdate;
	endCursor: number;
	localAwarenessState: LocalAwarenessState;
	log: LogFunction;
	onStatusChange: ( status: ConnectionStatus ) => void;
	processAwarenessUpdate: ( state: AwarenessState ) => void;
	processDocUpdate: ( update: SyncUpdate ) => SyncUpdate | void;
	unregister: () => void;
	updateQueue: UpdateQueue;
}

const roomStates: Map< string, RoomState > = new Map();

/**
 * Create a compaction update by merging existing updates. This preserves
 * the original operation metadata (client IDs, logical clocks) so that
 * Yjs deduplication works correctly when the compaction is applied.
 *
 * Deprecated: The server is moving towards full state updates for compaction.
 *
 * @param updates The updates to merge
 */
function createDeprecatedCompactionUpdate( updates: SyncUpdate[] ): SyncUpdate {
	// Extract only compaction and update types for merging (skip sync-step updates).
	// Decode base64 updates to Uint8Array for merging.
	const mergeable = updates
		.filter( ( u ) =>
			[ SyncUpdateType.COMPACTION, SyncUpdateType.UPDATE ].includes(
				u.type
			)
		)
		.map( ( u ) => base64ToUint8Array( u.data ) );

	// Merge all updates while preserving operation metadata.
	return createSyncUpdate(
		Y.mergeUpdates( mergeable ),
		SyncUpdateType.COMPACTION
	);
}

/**
 * Create sync step 1 update (announce our state vector).
 *
 * @param doc The Yjs document
 */
function createSyncStep1Update( doc: Y.Doc ): SyncUpdate {
	const encoder = encoding.createEncoder();
	syncProtocol.writeSyncStep1( encoder, doc );
	return createSyncUpdate(
		encoding.toUint8Array( encoder ),
		SyncUpdateType.SYNC_STEP_1
	);
}

/**
 * Create sync step 2 update (acknowledge sync step 1).
 *
 * @param doc   The Yjs document
 * @param step1 The sync step 1 update received
 */
function createSyncStep2Update( doc: Y.Doc, step1: Uint8Array ): SyncUpdate {
	const decoder = decoding.createDecoder( step1 );
	const encoder = encoding.createEncoder();
	syncProtocol.readSyncMessage(
		decoder,
		encoder,
		doc,
		POLLING_MANAGER_ORIGIN
	);
	return createSyncUpdate(
		encoding.toUint8Array( encoder ),
		SyncUpdateType.SYNC_STEP_2
	);
}

/**
 * Process an incoming awareness update from the server.
 *
 * @param state     The awareness state received
 * @param awareness The local Awareness instance
 */
function processAwarenessUpdate(
	state: AwarenessState,
	awareness: Awareness
): void {
	const currentStates = awareness.getStates();
	const added = new Set< number >();
	const updated = new Set< number >();

	// Removed clients are missing from the server state.
	const removed = new Set< number >(
		currentStates.keys().filter( ( clientId ) => ! state[ clientId ] )
	);

	Object.entries( state ).forEach( ( [ clientIdString, awarenessState ] ) => {
		const clientId = Number( clientIdString );

		// Skip our own state (we already have it locally).
		if ( clientId === awareness.clientID ) {
			return;
		}

		// A null state should be removed by the server, but handle it here just in case.
		if ( null === awarenessState ) {
			currentStates.delete( clientId );
			removed.add( clientId );
			return;
		}

		if ( ! currentStates.has( clientId ) ) {
			currentStates.set( clientId, awarenessState );
			added.add( clientId );
			return;
		}

		const currentState = currentStates.get( clientId );

		if (
			JSON.stringify( currentState ) !== JSON.stringify( awarenessState )
		) {
			currentStates.set( clientId, awarenessState );
			updated.add( clientId );
		}
	} );

	if ( added.size + updated.size > 0 ) {
		awareness.emit( 'change', [
			{
				added: Array.from( added ),
				updated: Array.from( updated ),
				// Left blank on purpose, as the removal of clients is handled in the if condition below.
				removed: [],
			},
		] );
	}

	if ( removed.size > 0 ) {
		removeAwarenessStates(
			awareness,
			Array.from( removed ),
			POLLING_MANAGER_ORIGIN
		);
	}
}

/**
 * Process an incoming sync / document update based on its type.
 *
 * @param update The typed update received
 * @param doc    The Yjs document
 * @param onSync Callback when sync is complete
 * @return A response update if needed (e.g., sync_step2 in response to sync_step1)
 */
function processDocUpdate(
	update: SyncUpdate,
	doc: Y.Doc,
	onSync: () => void
): SyncUpdate | void {
	const data = base64ToUint8Array( update.data );

	switch ( update.type ) {
		case SyncUpdateType.SYNC_STEP_1: {
			// Respond to sync step 1 with sync step 2.
			return createSyncStep2Update( doc, data );
		}

		case SyncUpdateType.SYNC_STEP_2: {
			// Apply sync step 2 (potentially contains missing updates).
			const decoder = decoding.createDecoder( data );
			const encoder = encoding.createEncoder();
			syncProtocol.readSyncMessage(
				decoder,
				encoder,
				doc,
				POLLING_MANAGER_ORIGIN
			);
			onSync();
			return;
		}

		case SyncUpdateType.COMPACTION:
		case SyncUpdateType.UPDATE: {
			// Apply document update directly.
			Y.applyUpdate( doc, data, POLLING_MANAGER_ORIGIN );
		}
	}
}

let areListenersRegistered = false;
let hasCollaborators = false;
let isActiveBrowser = 'visible' === document.visibilityState;
let isPolling = false;
let isUnloadPending = false;
let pollInterval = POLLING_INTERVAL_IN_MS;
let pollingTimeoutId: ReturnType< typeof setTimeout > | null = null;

/**
 * Mark that a page unload has been requested. This fires on
 * `beforeunload` which happens before the browser aborts in-flight
 * fetches, allowing us to distinguish poll failures caused by
 * navigation from genuine server errors in the catch block.
 *
 * If the user cancels the unload (e.g. by dismissing a "Save Changes?" dialog),
 * the flag is reset at the start of the next poll cycle so that polling can
 * resume.
 */
function handleBeforeUnload(): void {
	isUnloadPending = true;
}

/**
 * Send a disconnect signal for all registered rooms when the page is
 * being unloaded. Uses `sendBeacon` so the request survives navigation.
 */
function handlePageHide(): void {
	const rooms = Array.from( roomStates.entries() ).map(
		( [ room, state ] ) => ( {
			after: 0,
			awareness: null,
			client_id: state.clientId,
			room,
			updates: [],
		} )
	);

	postSyncUpdateNonBlocking( { rooms } );
}

/**
 * Hangle change in visibility state of browser tab.
 *
 * Used to trigger a slow down of the collaboration syncs when the
 * browser tab becomes inactive (either the user switches tabs or the
 * screen saver comes on).
 *
 * Fires on the document's visibilitychange event.
 */
function handleVisibilityChange() {
	const wasActive = isActiveBrowser;
	isActiveBrowser = document.visibilityState === 'visible';

	if ( isActiveBrowser && ! wasActive ) {
		/*
		 * Remove scheduled polling and repoll immediately when reactivated.
		 *
		 * This ensures that any updates by collaborators are immediately reflected
		 * in the document once the browser tab becomes active. Otherwise there would
		 * be a delay of 30 seconds before the updates came through.
		 */
		if ( pollingTimeoutId ) {
			clearTimeout( pollingTimeoutId );
			pollingTimeoutId = null;
		}

		if ( isPolling ) {
			poll();
		}
	}
}

function poll(): void {
	isPolling = true;

	async function start(): Promise< void > {
		if ( 0 === roomStates.size ) {
			isPolling = false;
			return;
		}

		// Reset the unloading flag at the start of each poll cycle so
		// it doesn't permanently suppress disconnect after the user
		// cancels a beforeunload dialog.
		isUnloadPending = false;

		// Emit 'connecting' status.
		roomStates.forEach( ( state ) => {
			state.onStatusChange( { status: 'connecting' } );
		} );

		// Create a payload with all queued updates. We include rooms even if they
		// have no updates to ensure we receive any incoming updates. Note that we
		// withhold our own updates until we detect another collaborator using the
		// queue's pause / resume mechanism.
		const payload: SyncPayload = {
			rooms: Array.from( roomStates.entries() ).map(
				( [ room, state ] ) => ( {
					after: state.endCursor ?? 0,
					awareness: state.localAwarenessState,
					client_id: state.clientId,
					room,
					updates: state.updateQueue.get(),
				} )
			),
		};

		try {
			const { rooms } = await postSyncUpdate( payload );

			// Emit 'connected' status.
			roomStates.forEach( ( state ) => {
				state.onStatusChange( { status: 'connected' } );
			} );

			rooms.forEach( ( room ) => {
				if ( ! roomStates.has( room.room ) ) {
					return;
				}

				const roomState = roomStates.get( room.room )!;
				roomState.endCursor = room.end_cursor;

				// Process awareness update.
				roomState.processAwarenessUpdate( room.awareness );

				// If there is another collaborator, resume the queue for the next poll
				// and increase polling frequency.
				if ( Object.keys( room.awareness ).length > 1 ) {
					hasCollaborators = true;
					roomState.updateQueue.resume();
				}

				// Process each incoming update and collect any responses.
				const responseUpdates = room.updates
					.map( ( update ) => roomState.processDocUpdate( update ) )
					.filter( ( update ): update is SyncUpdate =>
						Boolean( update )
					);
				roomState.updateQueue.addBulk( responseUpdates );

				// Respond to compaction requests from server. The server asks only one
				// client at a time to compact (lowest active client ID). We encode our
				// full document state to replace all prior updates on the server.
				if ( room.should_compact ) {
					roomState.log( 'Server requested compaction update' );
					roomState.updateQueue.clear();
					roomState.updateQueue.add(
						roomState.createCompactionUpdate()
					);
				} else if ( room.compaction_request ) {
					// Deprecated
					roomState.log( 'Server requested (old) compaction update' );
					roomState.updateQueue.add(
						createDeprecatedCompactionUpdate(
							room.compaction_request
						)
					);
				}
			} );

			// Recalculate polling interval.
			if ( isActiveBrowser && hasCollaborators ) {
				pollInterval = POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS;
			} else if ( isActiveBrowser ) {
				pollInterval = POLLING_INTERVAL_IN_MS;
			} else {
				pollInterval = POLLING_INTERVAL_BACKGROUND_TAB_IN_MS;
			}
		} catch ( error ) {
			// Exponential backoff on error: double the backoff time, up to max
			pollInterval = Math.min(
				pollInterval * 2,
				MAX_ERROR_BACKOFF_IN_MS
			);

			// Restore updates to queues on failure so they can be retried.
			for ( const room of payload.rooms ) {
				if ( ! roomStates.has( room.room ) ) {
					continue;
				}

				const state = roomStates.get( room.room )!;
				state.updateQueue.restore( room.updates );
				state.log(
					'Error posting sync update, will retry with backoff',
					{
						error,
						nextPoll: pollInterval,
					}
				);
			}

			// Don't report disconnected status when the request was aborted
			// due to page unload (e.g. during a refresh) to avoid briefly
			// flashing the disconnect dialog before the new page loads.
			if ( ! isUnloadPending ) {
				roomStates.forEach( ( state ) => {
					state.onStatusChange( { status: 'disconnected' } );
				} );
			}
		}

		pollingTimeoutId = setTimeout( poll, pollInterval );
	}

	// Start polling.
	void start();
}
function registerRoom( {
	room,
	doc,
	awareness,
	log,
	onSync,
	onStatusChange,
}: RegisterRoomOptions ): void {
	if ( roomStates.has( room ) ) {
		return;
	}

	// Note: Queue is initially paused. Call .resume() to unpause.
	const updateQueue = createUpdateQueue( [ createSyncStep1Update( doc ) ] );

	function onAwarenessUpdate(): void {
		roomState.localAwarenessState = awareness.getLocalState() ?? {};
	}

	function onDocUpdate( update: Uint8Array, origin: unknown ): void {
		if ( POLLING_MANAGER_ORIGIN === origin ) {
			return;
		}

		// Tag local document changes as 'update' type.
		updateQueue.add( createSyncUpdate( update, SyncUpdateType.UPDATE ) );
	}

	function unregister(): void {
		doc.off( 'update', onDocUpdate );
		awareness.off( 'change', onAwarenessUpdate );
		updateQueue.clear();
	}

	const roomState: RoomState = {
		clientId: doc.clientID,
		createCompactionUpdate: () =>
			createSyncUpdate(
				Y.encodeStateAsUpdate( doc ),
				SyncUpdateType.COMPACTION
			),
		endCursor: 0,
		localAwarenessState: awareness.getLocalState() ?? {},
		log,
		onStatusChange,
		processAwarenessUpdate: ( state: AwarenessState ) =>
			processAwarenessUpdate( state, awareness ),
		processDocUpdate: ( update: SyncUpdate ) =>
			processDocUpdate( update, doc, onSync ),
		unregister,
		updateQueue,
	};

	doc.on( 'update', onDocUpdate );
	awareness.on( 'change', onAwarenessUpdate );
	roomStates.set( room, roomState );

	if ( ! areListenersRegistered ) {
		window.addEventListener( 'beforeunload', handleBeforeUnload );
		window.addEventListener( 'pagehide', handlePageHide );
		document.addEventListener( 'visibilitychange', handleVisibilityChange );
		areListenersRegistered = true;
	}

	if ( ! isPolling ) {
		poll();
	}
}

function unregisterRoom( room: string ): void {
	const state = roomStates.get( room );
	if ( state ) {
		// Send a disconnect signal so the server removes this client's
		// awareness entry immediately instead of waiting for the timeout.
		const rooms = [
			{
				after: 0,
				awareness: null,
				client_id: state.clientId,
				room,
				updates: [],
			},
		];

		postSyncUpdateNonBlocking( { rooms } );
		state.unregister();
		roomStates.delete( room );
	}

	if ( 0 === roomStates.size && areListenersRegistered ) {
		window.removeEventListener( 'beforeunload', handleBeforeUnload );
		window.removeEventListener( 'pagehide', handlePageHide );
		document.removeEventListener(
			'visibilitychange',
			handleVisibilityChange
		);
		areListenersRegistered = false;
	}
}

export const pollingManager: PollingManager = {
	registerRoom,
	unregisterRoom,
};
