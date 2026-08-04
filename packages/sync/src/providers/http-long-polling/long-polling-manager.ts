/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import {
	DEFAULT_CLIENT_LIMIT_PER_ROOM,
	DISCONNECT_DIALOG_RETRY_MS,
	ERROR_RETRY_DELAYS_SOLO_MS,
	ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS,
	MANUAL_RETRY_INTERVAL_MS,
	MAX_ROOMS_PER_REQUEST,
	MAX_SYNC_REQUEST_BODY_SIZE_IN_BYTES,
	MAX_UPDATE_SIZE_IN_BYTES,
	MIN_REQUEST_INTERVAL_MS,
	MIN_SYNC_REQUEST_BODY_SIZE_LIMIT_IN_BYTES,
	POLLING_INTERVAL_BACKGROUND_TAB_IN_MS,
	SEND_DEBOUNCE_MS,
} from './config';
import { ConnectionError, ConnectionErrorCode } from '../../errors';
import type { ConnectionStatus } from '../../types';
import {
	type AwarenessState,
	type LocalAwarenessState,
	type SyncPayload,
	type SyncUpdate,
	SyncUpdateType,
	type UpdateQueue,
} from '../common/types';
import {
	createSyncUpdate,
	createUpdateQueue,
	intValueOrDefault,
	rotateWindow,
} from '../common/utils';
import {
	createCompactionUpdate,
	createDeprecatedCompactionUpdate,
	createSyncStep1Update,
	processAwarenessUpdate,
	processDocUpdate,
} from '../common/protocol';
import {
	isForbiddenError,
	isProtocolMismatchError,
	isRequestBodyTooLargeError,
	type WPRestError,
} from '../common/rest-errors';
import {
	postSyncUpdate,
	postSyncUpdateNonBlocking,
} from '../http-polling/utils';
import { isAbortError, postLongPollSyncUpdate } from './utils';

const LONG_POLLING_MANAGER_ORIGIN = 'long-polling-manager';

type LogFunction = (
	message: string,
	debug?: object,
	errorLevel?: 'error' | 'log' | 'warn',
	force?: boolean
) => void;

interface LongPollingManager {
	registerRoom: ( options: RegisterRoomOptions ) => void;
	retryNow: () => void;
	unregisterRoom: (
		room: string,
		options?: { sendDisconnectSignal?: boolean }
	) => void;
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
	isPrimaryRoom: boolean;
	localAwarenessState: LocalAwarenessState;
	log: LogFunction;
	onStatusChange: ( status: ConnectionStatus ) => void;
	processAwarenessUpdate: ( state: AwarenessState ) => void;
	processDocUpdate: ( update: SyncUpdate ) => SyncUpdate | void;
	room: string;
	unregister: () => void;
	updateQueue: UpdateQueue;
}

/**
 * Handle a 403 from the sync endpoint. Silently unregisters the affected
 * rooms listed in the error data, and restores pending updates for the
 * remaining rooms so they retry on the next request cycle.
 *
 * If the error does not include room details, it is treated as a generic auth
 * failure and all rooms are unregistered.
 *
 * @param error          The forbidden error, narrowed via isForbiddenError.
 * @param requestedRooms The rooms that were in the failing request.
 */
function handleForbiddenError(
	error: WPRestError,
	requestedRooms: SyncPayload[ 'rooms' ]
): void {
	const requestedRoomNames = new Set(
		requestedRooms.map( ( room ) => room.room )
	);
	const forbiddenRooms = Array.isArray( error.data.rooms )
		? error.data.rooms.filter( ( room ) => requestedRoomNames.has( room ) )
		: [];

	if ( forbiddenRooms.length > 0 ) {
		for ( const room of forbiddenRooms ) {
			const state = roomStates.get( room );
			if ( state ) {
				state.log(
					'Permission denied, unregistering room',
					{ error },
					'error',
					true // force
				);
				unregisterRoom( room, { sendDisconnectSignal: false } );
			}
		}

		// Restore updates for remaining rooms so they can be retried on
		// the next request cycle.
		for ( const room of requestedRooms ) {
			if ( forbiddenRooms.includes( room.room ) ) {
				continue;
			}
			if ( ! roomStates.has( room.room ) ) {
				continue;
			}
			const remainingState = roomStates.get( room.room )!;
			if ( room.updates.length > 0 ) {
				remainingState.updateQueue.restore( room.updates );
			}
		}
	} else {
		// Generic auth failure (e.g. not logged in) — unregister all rooms.
		const rooms = [ ...roomStates.keys() ];
		for ( const room of rooms ) {
			const state = roomStates.get( room );
			if ( state ) {
				state.log(
					'Permission denied, unregistering room',
					{ error },
					'error',
					true // force
				);
				unregisterRoom( room, { sendDisconnectSignal: false } );
			}
		}
	}
}

const roomStates: Map< string, RoomState > = new Map();

/**
 * Check whether the awareness state exceeds the configured connection limit.
 *
 * @param awareness The awareness state from the server response.
 * @param roomState The room state corresponding to the awareness state
 * @return True if a peer limit has been exceeded.
 */
function checkConnectionLimit(
	awareness: AwarenessState,
	roomState: RoomState
): boolean {
	if ( ! roomState.isPrimaryRoom || hasCheckedConnectionLimit ) {
		return false;
	}

	// Limits are only enforced on the initial connection.
	hasCheckedConnectionLimit = true;

	const maxClientsPerRoom = applyFilters(
		'sync.pollingProvider.maxClientsPerRoom',
		DEFAULT_CLIENT_LIMIT_PER_ROOM,
		roomState.room
	);

	const clientCount = Object.keys( awareness ).length;
	const validatedLimit = intValueOrDefault(
		maxClientsPerRoom,
		DEFAULT_CLIENT_LIMIT_PER_ROOM
	);

	if ( clientCount > validatedLimit ) {
		roomState.log( 'Connection limit exceeded', {
			clientCount,
			maxClientsPerRoom: validatedLimit,
			room: roomState.room,
		} );

		return true;
	}

	return false;
}

let areListenersRegistered = false;
let consecutiveFailures = 0;
let currentAbortController: AbortController | null = null;
let currentRequestHasUpdates = false;
let flushTimeoutId: ReturnType< typeof setTimeout > | null = null;
let hasCheckedConnectionLimit = false;
let hasCollaborators = false;
let isActiveBrowser = 'visible' === document.visibilityState;
let isManualRetry = false;
let isRequestLoopActive = false;
let isSelfAbort = false;
let isUnloadPending = false;
let requestTimeoutId: ReturnType< typeof setTimeout > | null = null;
let syncRequestBodySizeLimit = MAX_SYNC_REQUEST_BODY_SIZE_IN_BYTES;

// When more rooms are registered than the server allows per request
// (MAX_ROOMS_PER_REQUEST), the primary room is sent every request and the
// remaining "overflow" rooms are rotated across requests. This offset
// points into the overflow list at the next room to include.
let roomOverflowOffset = 0;

/**
 * Mark that a page unload has been requested. This fires on
 * `beforeunload` which happens before the browser aborts in-flight
 * fetches, allowing us to distinguish request failures caused by
 * navigation from genuine server errors in the catch block.
 */
function handleBeforeUnload(): void {
	isUnloadPending = true;
}

/**
 * Send a disconnect signal for all registered rooms when the page is
 * being unloaded. Uses keepalive so the request survives navigation.
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
 * Handle a change in the visibility state of the browser tab.
 *
 * Background tabs must not hold long-poll connections open, so on hide the
 * held request is aborted (a deliberate abort, not an error) and the loop
 * falls back to plain interval polling at the background cadence. On show,
 * the loop resumes long polling immediately.
 */
function handleVisibilityChange() {
	const wasActive = isActiveBrowser;
	isActiveBrowser = document.visibilityState === 'visible';

	if ( ! isActiveBrowser && wasActive ) {
		// Release a held long-poll; the next cycle uses interval polling.
		if ( currentAbortController && ! currentRequestHasUpdates ) {
			isSelfAbort = true;
			currentAbortController.abort();
		}
		return;
	}

	if ( isActiveBrowser && ! wasActive ) {
		// Resume long polling immediately when reactivated.
		if ( requestTimeoutId ) {
			clearTimeout( requestTimeoutId );
			requestTimeoutId = null;
			runRequest();
		}
	}
}

/**
 * Select which rooms to include in the next sync request.
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
	// and rotate the remaining overflow rooms across successive requests.
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

const textEncoder = new TextEncoder();

function getJsonByteLength( value: unknown ): number {
	return textEncoder.encode( JSON.stringify( value ) ).byteLength;
}

function createPayloadRoom(
	state: RoomState,
	updates: SyncUpdate[] = []
): SyncPayload[ 'rooms' ][ number ] {
	return {
		after: state.endCursor ?? 0,
		awareness: state.localAwarenessState,
		client_id: state.clientId,
		room: state.room,
		updates,
	};
}

function getUpdatePayloadSizeDelta(
	existingUpdateCount: number,
	update: SyncUpdate
): number {
	const commaSize = existingUpdateCount === 0 ? 0 : 1;
	return commaSize + getJsonByteLength( update );
}

function buildPayloadForRequest( selectedRoomStates: RoomState[] ): {
	payload: SyncPayload;
	roomsInRequest: RoomState[];
} {
	const payload: SyncPayload = { rooms: [] };
	const roomsInRequest: RoomState[] = [];

	for ( const state of selectedRoomStates ) {
		const room = createPayloadRoom( state );
		const candidate = { rooms: [ ...payload.rooms, room ] };
		if (
			payload.rooms.length > 0 &&
			getJsonByteLength( candidate ) > syncRequestBodySizeLimit
		) {
			break;
		}

		payload.rooms.push( room );
		roomsInRequest.push( state );
	}

	const pendingUpdates = roomsInRequest.map( ( state ) =>
		state.updateQueue.peek()
	);
	const sentUpdateCounts = roomsInRequest.map( () => 0 );

	let payloadSize = getJsonByteLength( payload );
	let addedUpdate = true;

	while ( addedUpdate ) {
		addedUpdate = false;

		for ( let i = 0; i < roomsInRequest.length; i++ ) {
			const update = pendingUpdates[ i ][ sentUpdateCounts[ i ] ];

			if ( ! update ) {
				continue;
			}

			const sizeDelta = getUpdatePayloadSizeDelta(
				sentUpdateCounts[ i ],
				update
			);
			if ( payloadSize + sizeDelta > syncRequestBodySizeLimit ) {
				continue;
			}

			sentUpdateCounts[ i ]++;
			payloadSize += sizeDelta;
			addedUpdate = true;
		}
	}

	for ( let i = 0; i < roomsInRequest.length; i++ ) {
		payload.rooms[ i ].updates = roomsInRequest[ i ].updateQueue.take(
			sentUpdateCounts[ i ]
		);
	}

	return { payload, roomsInRequest };
}

function restoreExactUpdates( payload: SyncPayload ): void {
	for ( const room of payload.rooms ) {
		if ( ! roomStates.has( room.room ) || room.updates.length === 0 ) {
			continue;
		}

		roomStates.get( room.room )!.updateQueue.restoreExact( room.updates );
	}
}

/**
 * Schedule the next request after `delayMs` milliseconds.
 *
 * @param delayMs Delay before the next request is issued.
 */
function scheduleNextRequest( delayMs: number ): void {
	if ( requestTimeoutId ) {
		clearTimeout( requestTimeoutId );
	}

	requestTimeoutId = setTimeout( runRequest, delayMs );
}

/**
 * Request that queued local updates are sent as soon as possible.
 *
 * If a long-poll request is being held open without outgoing updates, it is
 * deliberately aborted (after a short coalescing window) and immediately
 * re-issued carrying the queued updates. Requests that are already carrying
 * updates are never aborted.
 */
function requestImmediateSend(): void {
	if ( flushTimeoutId ) {
		return;
	}

	flushTimeoutId = setTimeout( () => {
		flushTimeoutId = null;

		if ( currentAbortController && ! currentRequestHasUpdates ) {
			// Abort the held request; the catch handler re-issues immediately.
			isSelfAbort = true;
			currentAbortController.abort();
			return;
		}

		// If the loop is idle between requests (and not backing off after a
		// failure), shortcut the delay and send now.
		if ( requestTimeoutId && 0 === consecutiveFailures ) {
			clearTimeout( requestTimeoutId );
			requestTimeoutId = null;
			runRequest();
		}
	}, SEND_DEBOUNCE_MS );
}

function runRequest(): void {
	isRequestLoopActive = true;
	requestTimeoutId = null;

	async function start(): Promise< void > {
		if ( 0 === roomStates.size ) {
			isRequestLoopActive = false;
			return;
		}

		// Reset the unloading flag at the start of each cycle so it doesn't
		// permanently suppress disconnect after the user cancels a
		// beforeunload dialog.
		isUnloadPending = false;

		const { payload, roomsInRequest } = buildPayloadForRequest(
			selectRoomsForRequest()
		);

		// Emit 'connecting' status only for rooms in this request. Rooms
		// rotated out of this request keep their prior status.
		roomsInRequest.forEach( ( state ) => {
			state.onStatusChange( { status: 'connecting' } );
		} );

		const useLongPoll = isActiveBrowser;
		// Ignore reason: measured in the success path only; error paths return early.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const requestStartedAt = Date.now();

		currentRequestHasUpdates = payload.rooms.some(
			( room ) => room.updates.length > 0
		);

		try {
			let rooms;

			if ( useLongPoll ) {
				currentAbortController = new AbortController();
				( { rooms } = await postLongPollSyncUpdate(
					payload,
					currentAbortController.signal
				) );
			} else {
				// Background tabs must not hold connections open; use the
				// plain polling endpoint at the background cadence instead.
				( { rooms } = await postSyncUpdate( payload ) );
			}

			currentAbortController = null;

			// Emit 'connected' status.
			consecutiveFailures = 0;
			isManualRetry = false;
			syncRequestBodySizeLimit = MAX_SYNC_REQUEST_BODY_SIZE_IN_BYTES;
			roomsInRequest.forEach( ( state ) => {
				// Skip rooms unregistered during the await. Their terminal
				// status was already set by whatever unregistered them.
				if ( roomStates.get( state.room ) !== state ) {
					return;
				}

				state.onStatusChange( { status: 'connected' } );
			} );

			// Reset before checking each room
			hasCollaborators = false;

			let receivedUpdates = false;

			rooms.forEach( ( room ) => {
				if ( ! roomStates.has( room.room ) ) {
					return;
				}

				const roomState = roomStates.get( room.room )!;
				roomState.endCursor = room.end_cursor;

				if ( room.updates.length > 0 ) {
					receivedUpdates = true;
				}

				// If a limit is exceeded, disconnect immediately without processing updates.
				if ( checkConnectionLimit( room.awareness, roomState ) ) {
					roomState.onStatusChange( {
						status: 'disconnected',
						error: new ConnectionError(
							ConnectionErrorCode.CONNECTION_LIMIT_EXCEEDED,
							'Connection limit exceeded'
						),
					} );
					unregisterRoom( room.room );
					return;
				}

				// Process awareness update.
				roomState.processAwarenessUpdate( room.awareness );

				// If there is another collaborator on the primary entity,
				// resume all room queues for the next request.
				if (
					roomState.isPrimaryRoom &&
					Object.keys( room.awareness ).length > 1
				) {
					hasCollaborators = true;
					roomStates.forEach( ( state ) => {
						state.updateQueue.resume();
					} );
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

				// Respond to compaction requests from server.
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

			if ( 0 === roomStates.size ) {
				isRequestLoopActive = false;
				return;
			}

			// Re-issue immediately. If the request returned very quickly with
			// nothing to deliver and nothing to send, apply a small minimum
			// interval so a misbehaving server can't cause a hot loop. In the
			// background, fall back to the plain polling cadence.
			let delay = 0;
			if ( ! isActiveBrowser ) {
				delay = POLLING_INTERVAL_BACKGROUND_TAB_IN_MS;
			} else {
				const elapsed = Date.now() - requestStartedAt;
				// peek() respects the paused state, so paused queues (e.g.
				// the seeded sync_step1 before a collaborator appears) do
				// not force an immediate re-issue.
				const hasQueuedUpdates = Array.from( roomStates.values() ).some(
					( state ) => state.updateQueue.peek().length > 0
				);
				if (
					! receivedUpdates &&
					! hasQueuedUpdates &&
					elapsed < MIN_REQUEST_INTERVAL_MS
				) {
					delay = MIN_REQUEST_INTERVAL_MS - elapsed;
				}
			}

			scheduleNextRequest( delay );
		} catch ( error ) {
			currentAbortController = null;

			// A deliberate abort (local updates queued while the request was
			// held, or the tab moving to the background) is not a failure:
			// nothing was sent, so there is nothing to restore or recover.
			// Re-issue immediately (the next cycle picks the right transport
			// for the current visibility state).
			if ( isSelfAbort && isAbortError( error ) ) {
				isSelfAbort = false;
				scheduleNextRequest(
					isActiveBrowser ? 0 : POLLING_INTERVAL_BACKGROUND_TAB_IN_MS
				);
				return;
			}

			isSelfAbort = false;

			// A 403 response means the user does not have permission to
			// sync a specific entity. Silently unregister the affected
			// room(s) and let the loop continue for the rest.
			if ( isForbiddenError( error ) ) {
				handleForbiddenError( error, payload.rooms );

				if ( roomStates.size === 0 ) {
					isRequestLoopActive = false;
					return;
				}

				scheduleNextRequest( 0 );
				return;
			}

			let retryDelay: number;

			if ( isRequestBodyTooLargeError( error ) ) {
				syncRequestBodySizeLimit = Math.max(
					MIN_SYNC_REQUEST_BODY_SIZE_LIMIT_IN_BYTES,
					Math.floor( syncRequestBodySizeLimit / 2 )
				);
				retryDelay = hasCollaborators
					? ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS[ 0 ]
					: ERROR_RETRY_DELAYS_SOLO_MS[ 0 ];
				restoreExactUpdates( payload );

				for ( const room of payload.rooms ) {
					if ( ! roomStates.has( room.room ) ) {
						continue;
					}

					roomStates.get( room.room )!.log(
						'Sync request body too large, retrying with smaller batches',
						{
							error,
							nextRequest: retryDelay,
							syncRequestBodySizeLimit,
						},
						'error',
						true // force
					);
				}

				scheduleNextRequest( retryDelay );
				return;
			}

			if ( isProtocolMismatchError( error ) ) {
				// The server explicitly signaled a protocol mismatch, so we
				// fail gracefully instead of retrying indefinitely.
				const affectedRooms = [ ...roomStates.entries() ];

				for ( const [ , state ] of affectedRooms ) {
					state.onStatusChange( {
						status: 'disconnected',
						error: new ConnectionError(
							ConnectionErrorCode.PROTOCOL_MISMATCH,
							'Protocol mismatch between client and server'
						),
					} );
				}

				for ( const [ room ] of affectedRooms ) {
					unregisterRoom( room, { sendDisconnectSignal: false } );
				}

				isRequestLoopActive = false;
				return;
			}

			// Use the explicit retry delay schedule for backoff.
			consecutiveFailures++;
			const retrySchedule = hasCollaborators
				? ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS
				: ERROR_RETRY_DELAYS_SOLO_MS;
			if ( consecutiveFailures <= retrySchedule.length ) {
				retryDelay = retrySchedule[ consecutiveFailures - 1 ];
			} else {
				retryDelay = DISCONNECT_DIALOG_RETRY_MS;
			}

			// After a manual retry, use a shorter interval for one cycle.
			if ( isManualRetry ) {
				retryDelay = MANUAL_RETRY_INTERVAL_MS;
				isManualRetry = false;
			}

			// Recover from the failed request. We don't know whether the
			// server stored our updates before the error occurred. For rooms
			// that had outgoing updates, replace the queue with a single
			// compaction (full document state), which is idempotent. Aborted
			// requests that carried no updates take the `updates.length > 0`
			// guard below and skip the compaction-recovery path entirely.
			for ( const room of payload.rooms ) {
				if ( ! roomStates.has( room.room ) ) {
					continue;
				}

				const state = roomStates.get( room.room )!;

				if ( room.updates.length > 0 && state.endCursor > 0 ) {
					state.updateQueue.clear();
					state.updateQueue.add( state.createCompactionUpdate() );
				} else if ( room.updates.length > 0 ) {
					state.updateQueue.restore( room.updates );
				}

				state.log(
					'Error posting sync update, will retry with backoff',
					{ error, nextRequest: retryDelay },
					'error',
					true // force
				);
			}

			// Don't report disconnected status when the request was aborted
			// due to page unload (e.g. during a refresh).
			if ( ! isUnloadPending ) {
				const backgroundRetriesFailed =
					consecutiveFailures > retrySchedule.length;

				roomsInRequest.forEach( ( state ) => {
					// Skip rooms unregistered during the await so their
					// terminal status isn't overwritten.
					if ( roomStates.get( state.room ) !== state ) {
						return;
					}

					state.onStatusChange( {
						status: 'disconnected',
						canManuallyRetry: true,
						consecutiveFailures,
						backgroundRetriesFailed,
						willAutoRetryInMs: retryDelay,
					} );
				} );
			}

			scheduleNextRequest( retryDelay );
		}
	}

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

	// The first-loaded entity is treated as "primary". See the polling
	// manager for a discussion of this heuristic.
	const isPrimaryRoom = 0 === roomStates.size;

	function onAwarenessUpdate(): void {
		roomState.localAwarenessState = awareness.getLocalState() ?? {};
		// Push awareness changes promptly so peers see cursors move without
		// waiting out the held request.
		requestImmediateSend();
	}

	function onDocUpdate( update: Uint8Array, origin: unknown ): void {
		if ( LONG_POLLING_MANAGER_ORIGIN === origin ) {
			return;
		}

		if ( update.byteLength > MAX_UPDATE_SIZE_IN_BYTES ) {
			const state = roomStates.get( room );
			if ( ! state ) {
				return;
			}

			state.log( 'Document size limit exceeded', {
				maxUpdateSizeInBytes: MAX_UPDATE_SIZE_IN_BYTES,
				updateSizeInBytes: update.byteLength,
			} );

			state.onStatusChange( {
				status: 'disconnected',
				error: new ConnectionError(
					ConnectionErrorCode.DOCUMENT_SIZE_LIMIT_EXCEEDED,
					'Document size limit exceeded'
				),
			} );

			// This is an unrecoverable error. Unregister the room to prevent syncing.
			unregisterRoom( room );
			return;
		}

		// Tag local document changes as 'update' type.
		updateQueue.add( createSyncUpdate( update, SyncUpdateType.UPDATE ) );

		// Abort a held long-poll (if any) and send the update promptly.
		requestImmediateSend();
	}

	function unregister(): void {
		doc.off( 'updateV2', onDocUpdate );
		awareness.off( 'change', onAwarenessUpdate );
		updateQueue.clear();
	}

	const roomState: RoomState = {
		clientId: doc.clientID,
		createCompactionUpdate: () => createCompactionUpdate( doc ),
		endCursor: 0,
		isPrimaryRoom,
		localAwarenessState: awareness.getLocalState() ?? {},
		log,
		onStatusChange,
		processAwarenessUpdate: ( state: AwarenessState ) =>
			processAwarenessUpdate(
				state,
				awareness,
				LONG_POLLING_MANAGER_ORIGIN
			),
		processDocUpdate: ( update: SyncUpdate ) =>
			processDocUpdate(
				update,
				doc,
				onSync,
				LONG_POLLING_MANAGER_ORIGIN
			),
		room,
		unregister,
		updateQueue,
	};

	doc.on( 'updateV2', onDocUpdate );
	awareness.on( 'change', onAwarenessUpdate );
	roomStates.set( room, roomState );

	if ( ! areListenersRegistered ) {
		window.addEventListener( 'beforeunload', handleBeforeUnload );
		window.addEventListener( 'pagehide', handlePageHide );
		document.addEventListener( 'visibilitychange', handleVisibilityChange );
		areListenersRegistered = true;
	}

	if ( ! isRequestLoopActive ) {
		runRequest();
	} else if ( currentAbortController && ! currentRequestHasUpdates ) {
		// A held request doesn't include the new room; release it so the
		// next request registers the room with the server promptly.
		requestImmediateSend();
	}
}

function unregisterRoom(
	room: string,
	{ sendDisconnectSignal = true }: { sendDisconnectSignal?: boolean } = {}
): void {
	const state = roomStates.get( room );
	if ( state ) {
		if ( sendDisconnectSignal ) {
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
		}

		state.unregister();
		roomStates.delete( room );
	}

	if ( 0 === roomStates.size ) {
		// Release any held request; the loop exits on the next cycle.
		if ( currentAbortController ) {
			isSelfAbort = true;
			currentAbortController.abort();
		}

		if ( requestTimeoutId ) {
			clearTimeout( requestTimeoutId );
			requestTimeoutId = null;
			isRequestLoopActive = false;
		}

		if ( flushTimeoutId ) {
			clearTimeout( flushTimeoutId );
			flushTimeoutId = null;
		}

		if ( areListenersRegistered ) {
			window.removeEventListener( 'beforeunload', handleBeforeUnload );
			window.removeEventListener( 'pagehide', handlePageHide );
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			);
			areListenersRegistered = false;
			hasCheckedConnectionLimit = false;
			consecutiveFailures = 0;
			roomOverflowOffset = 0;
			syncRequestBodySizeLimit = MAX_SYNC_REQUEST_BODY_SIZE_IN_BYTES;
		}
	}
}

/**
 * Immediately retry the sync connection by cancelling any pending
 * timeout and triggering a new request.
 */
function retryNow(): void {
	isManualRetry = true;

	if ( requestTimeoutId ) {
		clearTimeout( requestTimeoutId );
		requestTimeoutId = null;
		runRequest();
	}
}

export const longPollingManager: LongPollingManager = {
	registerRoom,
	retryNow,
	unregisterRoom,
};
