/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type {
	ConnectionStatus,
	EngineSessionCodec,
	EngineUpdate,
} from '../../types';
import type { AwarenessState } from '../../engines/session';

/**
 * A codec-driven WebSocket transport, symmetric with the HTTP polling
 * manager but PUSH-based: one shared socket carries every room, the server
 * pushes peers' updates the instant they arrive, and the client speaks the
 * same room-request/room-response shape the REST endpoints use (wrapped in a
 * `{type:'sync'}` frame). The transport never interprets update payloads —
 * it moves the engine session codec's opaque updates and awareness, exactly
 * like the polling transport.
 *
 * The socket is authenticated with a one-time token minted over REST
 * (`/wp-sync/v1/ws-token`); the daemon validates it against the logged-in
 * cookie on handshake.
 */

const WS_TOKEN_API_PATH = '/wp-sync/v1/ws-token';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const AWARENESS_INTERVAL_MS = 10000;

interface RoomState {
	room: string;
	session: EngineSessionCodec;
	cursor: number;
	onStatusChange: ( status: ConnectionStatus ) => void;
}

interface ServerRoom {
	room: string;
	awareness: AwarenessState;
	updates: EngineUpdate[];
	end_cursor: number;
	dispositions?: unknown[];
}

const rooms = new Map< string, RoomState >();

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType< typeof setTimeout > | null = null;
let awarenessTimer: ReturnType< typeof setInterval > | null = null;
let connecting = false;

/**
 * Fetches a one-time WebSocket token.
 *
 * @return {Promise<string>} The token.
 */
async function fetchToken(): Promise< string > {
	const response = ( await apiFetch( {
		method: 'POST',
		path: WS_TOKEN_API_PATH,
	} ) ) as { token?: string };
	if ( ! response?.token ) {
		throw new Error( 'Invalid ws-token response' );
	}
	return response.token;
}

/**
 * The announced socket URL with the token appended.
 *
 * @param {string} token One-time token.
 * @return {string} Socket URL.
 */
function socketUrl( token: string ): string {
	const base = window._wpCollaborationWebSocketUrl;
	if ( ! base ) {
		throw new Error( 'WebSocket URL is not configured' );
	}
	const separator = base.includes( '?' ) ? '&' : '?';
	return `${ base }${ separator }token=${ encodeURIComponent( token ) }`;
}

/**
 * Builds the sync frame for a set of rooms, optionally carrying each room's
 * queued local update.
 *
 * @param {Map<string, EngineUpdate[]>} pending Per-room updates to send.
 * @return {string} JSON frame.
 */
function buildSyncFrame( pending: Map< string, EngineUpdate[] > ): string {
	const payloadRooms = [];
	for ( const state of rooms.values() ) {
		payloadRooms.push( {
			after: state.cursor,
			awareness: state.session.getLocalAwareness(),
			client_id: state.session.clientId,
			room: state.room,
			updates: pending.get( state.room ) ?? [],
			...( state.session.engineSlug
				? {
						engine: state.session.engineSlug,
						engine_protocol: state.session.engineProtocol,
				  }
				: {} ),
		} );
	}
	return JSON.stringify( { type: 'sync', rooms: payloadRooms } );
}

/**
 * Sends a room's local update over the socket (or opens the socket first).
 *
 * @param {string}       room   Room identifier.
 * @param {EngineUpdate} update The update to send.
 */
function sendUpdate( room: string, update: EngineUpdate ): void {
	if ( ! socket || WebSocket.OPEN !== socket.readyState ) {
		// The initial sync on (re)connect will carry the codec's queued
		// updates; nothing to do until the socket is open.
		connect();
		return;
	}
	socket.send( buildSyncFrame( new Map( [ [ room, [ update ] ] ] ) ) );
}

/**
 * Applies a server room response to its room's codec.
 *
 * @param {ServerRoom} serverRoom One room's response.
 */
function applyServerRoom( serverRoom: ServerRoom ): void {
	const state = rooms.get( serverRoom.room );
	if ( ! state ) {
		return;
	}
	state.session.applyRemoteAwareness( serverRoom.awareness );

	const responses: EngineUpdate[] = [];
	for ( const update of serverRoom.updates ?? [] ) {
		try {
			const response = state.session.receiveUpdate( update );
			if ( response ) {
				responses.push( response );
			}
		} catch {
			// A malformed update must not tear down the socket.
		}
	}
	if ( serverRoom.dispositions && state.session.receiveDispositions ) {
		state.session.receiveDispositions( serverRoom.dispositions as never );
	}
	state.cursor = serverRoom.end_cursor;

	// Updates produced while applying (an engine's ack/response) go back out.
	if (
		responses.length > 0 &&
		socket &&
		WebSocket.OPEN === socket.readyState
	) {
		const pending = new Map< string, EngineUpdate[] >();
		pending.set( serverRoom.room, responses );
		socket.send( buildSyncFrame( pending ) );
	}
}

/**
 * Handles an incoming socket frame.
 *
 * @param {MessageEvent} event Socket message.
 */
function onMessage( event: MessageEvent ): void {
	let parsed: { type?: string; rooms?: ServerRoom[] };
	try {
		parsed = JSON.parse( String( event.data ) );
	} catch {
		return;
	}
	if ( 'sync' !== parsed.type || ! Array.isArray( parsed.rooms ) ) {
		return;
	}
	for ( const serverRoom of parsed.rooms ) {
		applyServerRoom( serverRoom );
	}
}

/**
 * Sends the initial sync for every room, carrying any queued local updates.
 */
function sendInitialSync(): void {
	if ( ! socket || WebSocket.OPEN !== socket.readyState ) {
		return;
	}
	const pending = new Map< string, EngineUpdate[] >();
	for ( const state of rooms.values() ) {
		pending.set( state.room, state.session.getInitialUpdates() );
	}
	socket.send( buildSyncFrame( pending ) );
}

/**
 * Periodically pushes local awareness so peers see presence and the server
 * keeps this client's entry fresh.
 */
function sendAwareness(): void {
	if (
		! socket ||
		WebSocket.OPEN !== socket.readyState ||
		0 === rooms.size
	) {
		return;
	}
	socket.send( buildSyncFrame( new Map() ) );
}

/**
 * Opens (or reuses) the shared socket.
 */
function connect(): void {
	if ( connecting || 0 === rooms.size ) {
		return;
	}
	if ( socket && WebSocket.OPEN === socket.readyState ) {
		return;
	}
	connecting = true;
	rooms.forEach( ( state ) =>
		state.onStatusChange( { status: 'connecting' } )
	);

	fetchToken()
		.then( ( token ) => {
			socket = new window.WebSocket( socketUrl( token ) );
			socket.addEventListener( 'open', () => {
				connecting = false;
				reconnectAttempts = 0;
				rooms.forEach( ( state ) =>
					state.onStatusChange( { status: 'connected' } )
				);
				sendInitialSync();
				if ( ! awarenessTimer ) {
					awarenessTimer = setInterval(
						sendAwareness,
						AWARENESS_INTERVAL_MS
					);
				}
			} );
			socket.addEventListener( 'message', onMessage );
			socket.addEventListener( 'close', onClose );
			socket.addEventListener( 'error', () => socket?.close() );
		} )
		.catch( () => {
			connecting = false;
			scheduleReconnect();
		} );
}

/**
 * Handles socket close: mark disconnected and schedule a reconnect while any
 * room is still registered.
 */
function onClose(): void {
	connecting = false;
	socket = null;
	if ( awarenessTimer ) {
		clearInterval( awarenessTimer );
		awarenessTimer = null;
	}
	rooms.forEach( ( state ) =>
		state.onStatusChange( { status: 'disconnected' } )
	);
	if ( rooms.size > 0 ) {
		scheduleReconnect();
	}
}

/**
 * Schedules a reconnect with exponential backoff.
 */
function scheduleReconnect(): void {
	if ( reconnectTimer || 0 === rooms.size ) {
		return;
	}
	const delay = Math.min(
		RECONNECT_MAX_MS,
		RECONNECT_BASE_MS * 2 ** reconnectAttempts
	);
	reconnectAttempts++;
	reconnectTimer = setTimeout( () => {
		reconnectTimer = null;
		connect();
	}, delay );
}

export interface WebSocketRoomOptions {
	room: string;
	session: EngineSessionCodec;
	onStatusChange: ( status: ConnectionStatus ) => void;
}

export interface WebSocketManager {
	registerRoom: ( options: WebSocketRoomOptions ) => void;
	unregisterRoom: ( room: string ) => void;
}

/**
 * Registers a room: track it, forward its local updates to the socket, and
 * ensure the socket is open.
 *
 * @param {WebSocketRoomOptions} options Room options.
 */
function registerRoom( options: WebSocketRoomOptions ): void {
	const state: RoomState = {
		room: options.room,
		session: options.session,
		cursor: 0,
		onStatusChange: options.onStatusChange,
	};
	rooms.set( options.room, state );
	options.session.onLocalUpdate( ( update ) =>
		sendUpdate( options.room, update )
	);

	if ( socket && WebSocket.OPEN === socket.readyState ) {
		// Socket already open: send this room's initial sync now.
		socket.send(
			buildSyncFrame(
				new Map( [
					[ options.room, options.session.getInitialUpdates() ],
				] )
			)
		);
	} else {
		connect();
	}
}

/**
 * Unregisters a room; closes the socket when the last room leaves.
 *
 * @param {string} room Room identifier.
 */
function unregisterRoom( room: string ): void {
	const state = rooms.get( room );
	if ( state ) {
		state.session.destroy();
		rooms.delete( room );
	}
	if ( 0 === rooms.size ) {
		if ( reconnectTimer ) {
			clearTimeout( reconnectTimer );
			reconnectTimer = null;
		}
		if ( awarenessTimer ) {
			clearInterval( awarenessTimer );
			awarenessTimer = null;
		}
		socket?.close();
		socket = null;
	}
}

export const websocketManager: WebSocketManager = {
	registerRoom,
	unregisterRoom,
};

/**
 * Resets the module state. Test use only.
 */
export function resetWebSocketManagerForTesting(): void {
	rooms.clear();
	if ( reconnectTimer ) {
		clearTimeout( reconnectTimer );
		reconnectTimer = null;
	}
	if ( awarenessTimer ) {
		clearInterval( awarenessTimer );
		awarenessTimer = null;
	}
	socket = null;
	connecting = false;
	reconnectAttempts = 0;
}
