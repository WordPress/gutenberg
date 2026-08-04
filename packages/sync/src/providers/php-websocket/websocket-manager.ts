/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
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
	MAX_UPDATE_SIZE_IN_BYTES,
} from '../http-polling/config';
import { ConnectionError, ConnectionErrorCode } from '../../errors';
import type { ConnectionStatus } from '../../types';
import {
	type AwarenessState,
	type LocalAwarenessState,
	type SyncEnvelopeFromServer,
	type SyncUpdate,
	SyncUpdateType,
	type UpdateQueue,
} from '../common/types';
import {
	createSyncUpdate,
	createUpdateQueue,
	intValueOrDefault,
} from '../common/utils';
import {
	createCompactionUpdate,
	createDeprecatedCompactionUpdate,
	createSyncStep1Update,
	processAwarenessUpdate,
	processDocUpdate,
} from '../common/protocol';
import { postSyncUpdateNonBlocking } from '../http-polling/utils';

const WEBSOCKET_MANAGER_ORIGIN = 'php-websocket-manager';

const WS_TOKEN_API_PATH = '/wp-sync/v1/ws-token';

// Small coalescing window for outgoing sends so rapid successive changes
// (e.g. typing) batch into a single frame.
const SEND_DEBOUNCE_MS = 50;

type LogFunction = (
	message: string,
	debug?: object,
	errorLevel?: 'error' | 'log' | 'warn',
	force?: boolean
) => void;

interface WebSocketSyncManager {
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
	awarenessDirty: boolean;
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

interface SyncMessageFromServer {
	type: 'sync';
	rooms: SyncEnvelopeFromServer[];
}

interface ErrorMessageFromServer {
	type: 'error';
	code?: string;
	message?: string;
	rooms?: string[];
}

const roomStates: Map< string, RoomState > = new Map();

/**
 * Minimal debug surface for e2e tests, mirroring the shape used by the
 * y-websocket test provider. The Playwright collaboration fixtures poll
 * this to await connection/sync state, since the WebSocket transport does
 * not produce the recurring HTTP wp-sync responses the fixtures otherwise
 * observe.
 */
interface DebugRoomState {
	clientId: number | null;
	status: ConnectionStatus[ 'status' ];
	synced: boolean;
}

const debugState: {
	rooms: Record< string, DebugRoomState >;
	tick: number;
} = { rooms: {}, tick: 0 };

(
	window as Window & { __gutenbergPhpWebSocketSync?: typeof debugState }
 ).__gutenbergPhpWebSocketSync = debugState;

function updateDebugState(
	room: string,
	patch: Partial< DebugRoomState >
): void {
	if ( ! debugState.rooms[ room ] ) {
		debugState.rooms[ room ] = {
			clientId: null,
			status: 'disconnected',
			synced: false,
		};
	}

	Object.assign( debugState.rooms[ room ], patch );
	debugState.tick += 1;
}

let areListenersRegistered = false;
let consecutiveFailures = 0;
let flushTimeoutId: ReturnType< typeof setTimeout > | null = null;
let hasCheckedConnectionLimit = false;
let hasCollaborators = false;
let isConnecting = false;
let isDestroyingSocket = false;
let isManualRetry = false;
let reconnectTimeoutId: ReturnType< typeof setTimeout > | null = null;
let socket: WebSocket | null = null;

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

/**
 * Fetch a fresh one-time WebSocket token from the REST API.
 */
async function fetchWsToken(): Promise< string > {
	const response = await apiFetch< { token?: string } >( {
		method: 'POST',
		path: WS_TOKEN_API_PATH,
	} );

	if ( ! response || typeof response.token !== 'string' ) {
		throw new Error( 'Invalid ws-token response' );
	}

	return response.token;
}

function getWebSocketUrl( token: string ): string {
	const base = window._wpCollaborationWebSocketUrl;

	if ( ! base ) {
		throw new Error( 'WebSocket URL is not configured' );
	}

	const separator = base.includes( '?' ) ? '&' : '?';

	return `${ base }${ separator }token=${ encodeURIComponent( token ) }`;
}

function emitStatusToAll( status: ConnectionStatus ): void {
	roomStates.forEach( ( state ) => {
		state.onStatusChange( status );
	} );
}

/**
 * Build the client sync envelope for a room.
 *
 * @param state          The room state.
 * @param includeUpdates Whether to drain the room's update queue.
 */
function createRoomEnvelope( state: RoomState, includeUpdates = true ) {
	state.awarenessDirty = false;

	return {
		after: state.endCursor ?? 0,
		awareness: state.localAwarenessState,
		client_id: state.clientId,
		room: state.room,
		updates: includeUpdates ? state.updateQueue.get() : [],
	};
}

/**
 * Send a sync message for the given room states over the open socket.
 *
 * @param states Rooms to include.
 */
function sendSyncMessage( states: RoomState[] ): void {
	if ( ! socket || WebSocket.OPEN !== socket.readyState ) {
		return;
	}

	const rooms = states
		.slice( 0, MAX_ROOMS_PER_REQUEST )
		.map( ( state ) => createRoomEnvelope( state ) );

	if ( 0 === rooms.length ) {
		return;
	}

	socket.send( JSON.stringify( { rooms, type: 'sync' } ) );
}

/**
 * Schedule a flush of dirty rooms (queued updates or changed awareness)
 * after a short coalescing window.
 */
function scheduleFlush(): void {
	if ( flushTimeoutId ) {
		return;
	}

	flushTimeoutId = setTimeout( () => {
		flushTimeoutId = null;

		const dirtyRooms = Array.from( roomStates.values() ).filter(
			( state ) => state.awarenessDirty || state.updateQueue.size() > 0
		);

		sendSyncMessage( dirtyRooms );
	}, SEND_DEBOUNCE_MS );
}

/**
 * Process a sync message received from the server.
 *
 * @param message The decoded sync message.
 */
function processSyncMessage( message: SyncMessageFromServer ): void {
	message.rooms.forEach( ( room ) => {
		if ( ! roomStates.has( room.room ) ) {
			return;
		}

		const roomState = roomStates.get( room.room )!;
		roomState.endCursor = room.end_cursor;

		// If a limit is exceeded, disconnect immediately without processing.
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

		// Resume queues once a collaborator is present on the primary room.
		if (
			roomState.isPrimaryRoom &&
			Object.keys( room.awareness ).length > 1
		) {
			hasCollaborators = true;
			roomStates.forEach( ( state ) => {
				state.updateQueue.resume();
			} );
			// The initial sync_step1 (and any queued local updates) can now
			// be sent.
			scheduleFlush();
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

		if ( responseUpdates.length > 0 ) {
			roomState.updateQueue.addBulk( responseUpdates );
			scheduleFlush();
		}

		// Respond to compaction requests from the server.
		if ( room.should_compact ) {
			roomState.log( 'Server requested compaction update' );
			roomState.updateQueue.clear();
			roomState.updateQueue.add( roomState.createCompactionUpdate() );
			scheduleFlush();
		} else if ( room.compaction_request ) {
			// Deprecated
			roomState.log( 'Server requested (old) compaction update' );
			roomState.updateQueue.add(
				createDeprecatedCompactionUpdate( room.compaction_request )
			);
			scheduleFlush();
		}
	} );
}

/**
 * Process an error message received from the server. Room-scoped errors
 * (e.g. permission failures) silently unregister the affected rooms; other
 * errors are logged.
 *
 * @param message The decoded error message.
 */
function processErrorMessage( message: ErrorMessageFromServer ): void {
	const rooms = Array.isArray( message.rooms ) ? message.rooms : [];

	if ( 0 === rooms.length ) {
		roomStates.forEach( ( state ) => {
			state.log(
				'Sync server reported an error',
				{ message },
				'error',
				true // force
			);
		} );
		return;
	}

	for ( const room of rooms ) {
		const state = roomStates.get( room );
		if ( state ) {
			state.log(
				'Permission denied, unregistering room',
				{ message },
				'error',
				true // force
			);
			unregisterRoom( room, { sendDisconnectSignal: false } );
		}
	}
}

function handleSocketMessage( event: MessageEvent ): void {
	let message: unknown;

	try {
		message = JSON.parse( String( event.data ) );
	} catch {
		return;
	}

	const type = ( message as { type?: string } | null )?.type;

	if ( 'sync' === type ) {
		const syncMessage = message as SyncMessageFromServer;
		if ( Array.isArray( syncMessage.rooms ) ) {
			processSyncMessage( syncMessage );
		}
		return;
	}

	if ( 'error' === type ) {
		processErrorMessage( message as ErrorMessageFromServer );
	}
}

function handleSocketClose(): void {
	socket = null;

	if ( isDestroyingSocket ) {
		isDestroyingSocket = false;
		return;
	}

	if ( 0 === roomStates.size ) {
		return;
	}

	scheduleReconnect();
}

/**
 * Schedule a reconnection attempt using the shared backoff schedule. A
 * fresh token is minted on every attempt.
 */
function scheduleReconnect(): void {
	if ( reconnectTimeoutId || isConnecting ) {
		return;
	}

	consecutiveFailures++;
	const retrySchedule = hasCollaborators
		? ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS
		: ERROR_RETRY_DELAYS_SOLO_MS;

	let retryDelay: number;
	if ( consecutiveFailures <= retrySchedule.length ) {
		retryDelay = retrySchedule[ consecutiveFailures - 1 ];
	} else {
		retryDelay = DISCONNECT_DIALOG_RETRY_MS;
	}

	if ( isManualRetry ) {
		retryDelay = MANUAL_RETRY_INTERVAL_MS;
		isManualRetry = false;
	}

	emitStatusToAll( {
		status: 'disconnected',
		canManuallyRetry: true,
		consecutiveFailures,
		backgroundRetriesFailed: consecutiveFailures > retrySchedule.length,
		willAutoRetryInMs: retryDelay,
	} );

	reconnectTimeoutId = setTimeout( () => {
		reconnectTimeoutId = null;
		void connect();
	}, retryDelay );
}

/**
 * Open the WebSocket connection: mint a token, connect, and send the
 * initial sync for every registered room.
 */
async function connect(): Promise< void > {
	if ( isConnecting || socket || 0 === roomStates.size ) {
		return;
	}

	isConnecting = true;
	emitStatusToAll( { status: 'connecting' } );

	let ws: WebSocket;

	try {
		const token = await fetchWsToken();
		ws = new WebSocket( getWebSocketUrl( token ) );
	} catch ( error ) {
		isConnecting = false;

		roomStates.forEach( ( state ) => {
			state.log(
				'Failed to initiate WebSocket connection',
				{ error },
				'error',
				true // force
			);
		} );

		scheduleReconnect();
		return;
	}

	socket = ws;

	ws.addEventListener( 'open', () => {
		if ( socket !== ws ) {
			return;
		}

		isConnecting = false;
		consecutiveFailures = 0;
		isManualRetry = false;

		emitStatusToAll( { status: 'connected' } );

		// Initial sync: announce every registered room (cursor, awareness,
		// and any queued updates including the seeded sync_step1).
		sendSyncMessage( Array.from( roomStates.values() ) );
	} );

	ws.addEventListener( 'message', handleSocketMessage );

	ws.addEventListener( 'close', () => {
		if ( socket !== ws && ! isDestroyingSocket ) {
			return;
		}

		isConnecting = false;
		handleSocketClose();
	} );

	ws.addEventListener( 'error', () => {
		// The close event follows and drives reconnection.
	} );
}

/**
 * Send a disconnect signal for all registered rooms when the page is being
 * unloaded. The REST beacon endpoint is used because a closing page cannot
 * wait for WebSocket delivery guarantees.
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

	closeSocket();
}

function closeSocket(): void {
	if ( socket ) {
		isDestroyingSocket = true;

		try {
			socket.close( 1000 );
		} catch {
			// Ignore errors from closing an already-closed socket.
		}

		socket = null;
	}

	if ( reconnectTimeoutId ) {
		clearTimeout( reconnectTimeoutId );
		reconnectTimeoutId = null;
	}

	if ( flushTimeoutId ) {
		clearTimeout( flushTimeoutId );
		flushTimeoutId = null;
	}
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
		roomState.awarenessDirty = true;
		scheduleFlush();
	}

	function onDocUpdate( update: Uint8Array, origin: unknown ): void {
		if ( WEBSOCKET_MANAGER_ORIGIN === origin ) {
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
		scheduleFlush();
	}

	function unregister(): void {
		doc.off( 'updateV2', onDocUpdate );
		awareness.off( 'change', onAwarenessUpdate );
		updateQueue.clear();
	}

	updateDebugState( room, {
		clientId: doc.clientID,
		status: 'connecting',
		synced: false,
	} );

	const roomState: RoomState = {
		awarenessDirty: true,
		clientId: doc.clientID,
		createCompactionUpdate: () => createCompactionUpdate( doc ),
		endCursor: 0,
		isPrimaryRoom,
		localAwarenessState: awareness.getLocalState() ?? {},
		log,
		onStatusChange: ( status: ConnectionStatus ) => {
			updateDebugState( room, { status: status.status } );
			onStatusChange( status );
		},
		processAwarenessUpdate: ( state: AwarenessState ) =>
			processAwarenessUpdate(
				state,
				awareness,
				WEBSOCKET_MANAGER_ORIGIN
			),
		processDocUpdate: ( update: SyncUpdate ) =>
			processDocUpdate(
				update,
				doc,
				() => {
					updateDebugState( room, { synced: true } );
					onSync();
				},
				WEBSOCKET_MANAGER_ORIGIN
			),
		room,
		unregister,
		updateQueue,
	};

	doc.on( 'updateV2', onDocUpdate );
	awareness.on( 'change', onAwarenessUpdate );
	roomStates.set( room, roomState );

	if ( ! areListenersRegistered ) {
		window.addEventListener( 'pagehide', handlePageHide );
		areListenersRegistered = true;
	}

	if ( socket && WebSocket.OPEN === socket.readyState ) {
		// Announce the new room on the existing connection.
		sendSyncMessage( [ roomState ] );
	} else {
		void connect();
	}
}

function unregisterRoom(
	room: string,
	{ sendDisconnectSignal = true }: { sendDisconnectSignal?: boolean } = {}
): void {
	const state = roomStates.get( room );
	if ( state ) {
		if (
			sendDisconnectSignal &&
			socket &&
			WebSocket.OPEN === socket.readyState
		) {
			// A null awareness state removes this client's awareness entry
			// on the server immediately.
			socket.send(
				JSON.stringify( {
					rooms: [
						{
							after: 0,
							awareness: null,
							client_id: state.clientId,
							room,
							updates: [],
						},
					],
					type: 'sync',
				} )
			);
		}

		state.unregister();
		roomStates.delete( room );
		updateDebugState( room, { status: 'disconnected', synced: false } );
	}

	if ( 0 === roomStates.size ) {
		closeSocket();

		if ( areListenersRegistered ) {
			window.removeEventListener( 'pagehide', handlePageHide );
			areListenersRegistered = false;
		}

		consecutiveFailures = 0;
		hasCheckedConnectionLimit = false;
		hasCollaborators = false;
		isConnecting = false;
	}
}

/**
 * Immediately retry the connection by cancelling any pending reconnect
 * timeout and connecting now.
 */
function retryNow(): void {
	isManualRetry = true;

	if ( reconnectTimeoutId ) {
		clearTimeout( reconnectTimeoutId );
		reconnectTimeoutId = null;
		void connect();
	}
}

export const webSocketSyncManager: WebSocketSyncManager = {
	registerRoom,
	retryNow,
	unregisterRoom,
};
