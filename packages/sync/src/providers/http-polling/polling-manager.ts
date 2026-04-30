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
	MAX_ERROR_BACKOFF_IN_MS,
	MAX_ROOMS_PER_REQUEST,
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
	rotateWindow,
} from './utils';

const POLLING_MANAGER_ORIGIN = 'polling-manager';

type LogFunction = (
	message: string,
	debug?: object,
	errorLevel?: 'error' | 'log' | 'warn',
	force?: boolean
) => void;

interface PollingManager {
	registerRoom: ( options: RegisterRoomOptions ) => void;
	retryNow: () => void;
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
	endCursor: number;
	enforceConnectionLimit: boolean;
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
 * @param updates The updates to merge
 */
function createCompactionUpdate( updates: SyncUpdate[] ): SyncUpdate {
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
		Y.mergeUpdatesV2( mergeable ),
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
			Y.applyUpdateV2( doc, data, POLLING_MANAGER_ORIGIN );
		}
	}
}

	if ( ! roomState.enforceConnectionLimit ) {
	roomState.enforceConnectionLimit = false;
let areListenersRegistered = false;
let hasCollaborators = false;
let isActiveBrowser = 'visible' === document.visibilityState;
let isPolling = false;
let pollInterval = POLLING_INTERVAL_IN_MS;
let pollingTimeoutId: ReturnType< typeof setTimeout > | null = null;
// When more rooms are registered than the server allows per request
// (MAX_ROOMS_PER_REQUEST), the primary room is sent every poll and the
// remaining "overflow" rooms are rotated across polls. This offset
// points into the overflow list at the next room to include.
let roomOverflowOffset = 0;


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

	for ( let i = 0; i < rooms.length; i += MAX_ROOMS_PER_REQUEST ) {
		postSyncUpdateNonBlocking( {
			rooms: rooms.slice( i, i + MAX_ROOMS_PER_REQUEST ),
		} );
	}
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
			poll();
		}
	}
}

/**
 * Select which rooms to include in the next sync request.
 *
 * The server caps requests at MAX_ROOMS_PER_REQUEST rooms. When fewer rooms are
 * registered than the cap, every room is included on every poll. When the cap
 * is exceeded, the primary room is sent on every poll (so the main document
 * stays fully synced) and the remaining overflow rooms are rotated across
 * successive polls so each one is included (at a reduced frequency).
 *
 * Rooms that are skipped on a given poll keep their queued updates; the updates
 * are drained on the next poll that includes them.
 *
 * @return The RoomStates to include in this request, in send order.
 */
function selectRoomsForRequest(): RoomState[] {
	const allRooms = Array.from( roomStates.values() );

	// Fast path: everything fits in a single request.
	if ( allRooms.length <= MAX_ROOMS_PER_REQUEST ) {
		return allRooms;
	}

	// Rotation path: pin the primary room to every request (if one exists)
	// and rotate the remaining overflow rooms across successive polls.
	const primaryRoom = allRooms.find( ( state ) => state.isPrimaryRoom );
	const overflowRooms = allRooms.filter( ( state ) => state !== primaryRoom );
	const overflowSlotsPerRequest =
		MAX_ROOMS_PER_REQUEST - ( primaryRoom ? 1 : 0 );

	const { window: overflowSlice, nextOffset } = rotateWindow(
		overflowRooms,
		roomOverflowOffset,
		overflowSlotsPerRequest
	);
	roomOverflowOffset = nextOffset;

	if ( primaryRoom ) {
		return [ primaryRoom, ...overflowSlice ];
	}

	return overflowSlice;
}

function poll(): void {
	isPolling = true;
	pollingTimeoutId = null;

	async function start(): Promise< void > {
		if ( 0 === roomStates.size ) {
			isPolling = false;
			return;
		}

		// Create a payload with all queued updates. We include rooms even if they
		// have no updates to ensure we receive any incoming updates. Note that we
		// withhold our own updates until we detect another collaborator using the
		// queue's pause / resume mechanism.
		const roomsInRequest = selectRoomsForRequest();
		const payload: SyncPayload = {
			rooms: roomsInRequest.map( ( state ) => ( {
				after: state.endCursor ?? 0,
				awareness: state.localAwarenessState,
				client_id: state.clientId,
				room: state.room,
				updates: state.updateQueue.get(),
			} ) ),
		};

		// Emit 'connecting' status only for rooms in this request. Rooms
		// rotated out of this poll keep their prior status.
		roomsInRequest.forEach( ( state ) => {
			state.onStatusChange( { status: 'connecting' } );
		} );

		try {
			const { rooms } = await postSyncUpdate( payload );

			// Emit 'connected' status.
			roomsInRequest.forEach( ( state ) => {
				// Skip rooms unregistered during the await (e.g. the
				// size-limit handler in onDocUpdate). Their terminal
				// status was already set by whatever unregistered them.
				if ( roomStates.get( state.room ) !== state ) {
					return;
				}

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
				// resume the queue for the next poll and increase polling
				// frequency. We only check the primary room to avoid false
				// positives from shared collection rooms (e.g. taxonomy/category).
					hasCollaborators = true;
					roomState.updateQueue.resume();
				}

				// Process each incoming update and collect any responses.
				const responseUpdates: SyncUpdate[] = [];
				for ( const update of room.updates ) {
					try {
						const response = roomState.processDocUpdate( update );
						if ( response ) {
							responseUpdates.push( response );
						}
					} catch ( error ) {
						roomState.log(
							'Failed to apply sync update',
							{ error, update },
							'error',
							true // force
						);
					}
				}

				roomState.updateQueue.addBulk( responseUpdates );

				// Respond to compaction requests from server. The server asks only one
				// client at a time to compact (lowest active client ID). We merge the
				// received updates (the server has given us everything it has).
				if ( room.compaction_request ) {
					roomState.updateQueue.add(
						createCompactionUpdate( room.compaction_request )
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
			// Use the explicit retry delay schedule for backoff.
			consecutiveFailures++;
			const retrySchedule = hasCollaborators
				? ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS
				: ERROR_RETRY_DELAYS_SOLO_MS;
			if ( consecutiveFailures <= retrySchedule.length ) {
				pollInterval = retrySchedule[ consecutiveFailures - 1 ];
				pollInterval = DISCONNECT_DIALOG_RETRY_MS;
			}

			// After a manual retry, use a shorter interval for one cycle.
			if ( isManualRetry ) {
				pollInterval = MANUAL_RETRY_INTERVAL_MS;
				isManualRetry = false;
			}

				}

				const state = roomStates.get( room.room )!;

				if ( room.updates.length > 0 && state.endCursor > 0 ) {
					state.updateQueue.clear();
				}

				state.log(
					'Error posting sync update, will retry with backoff',
					{ error, nextPoll: pollInterval },
					'error',
					true // force
				);
			}

			// Don't report disconnected status when the request was aborted
				roomStates.forEach( ( state ) => {
					state.onStatusChange( {
						status: 'disconnected',
						canManuallyRetry: true,
						consecutiveFailures,
						backgroundRetriesFailed,
						willAutoRetryInMs: pollInterval,
						// Skip rooms unregistered during the await so
						// their terminal status isn't overwritten.
						if ( roomStates.get( state.room ) !== state ) {
							return;
						}

					} );
				} );
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

	const enforceConnectionLimit = 0 === roomStates.size;
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
		doc.off( 'updateV2', onDocUpdate );
		awareness.off( 'change', onAwarenessUpdate );
		updateQueue.clear();
	}

	const roomState: RoomState = {
		clientId: doc.clientID,
		endCursor: 0,
		enforceConnectionLimit,
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

	doc.on( 'updateV2', onDocUpdate );
	awareness.on( 'change', onAwarenessUpdate );
	roomStates.set( room, roomState );

	if ( ! areListenersRegistered ) {
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
		window.removeEventListener( 'pagehide', handlePageHide );
		document.removeEventListener(
			'visibilitychange',
			handleVisibilityChange
		);
		areListenersRegistered = false;
		roomOverflowOffset = 0;
	}
}

/**
 * Immediately retry the sync connection by cancelling any pending backoff
 * timeout and triggering a new poll. If a request is already in-flight,
 * the backoff interval is reset so the next scheduled poll fires sooner.
 */
function retryNow(): void {
	pollInterval = POLLING_INTERVAL_IN_MS * 2;

	if ( pollingTimeoutId ) {
		clearTimeout( pollingTimeoutId );
		pollingTimeoutId = null;
		poll();
	}
}

export const pollingManager: PollingManager = {
	registerRoom,
	retryNow,
	unregisterRoom,
};
