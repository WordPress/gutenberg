#!/usr/bin/env node

import http from 'node:http';
import process from 'node:process';
// eslint-disable-next-line import/no-extraneous-dependencies
import ws from 'ws';

const WebSocketServer = ws.WebSocketServer || ws.Server;

/**
 * @typedef {import('ws').RawData} RawData
 * @typedef {import('ws').WebSocket & { roomName?: string, clientId?: string | number }} TestSocket
 * @typedef {{ awareness: Map<string, unknown>, clients: Set<TestSocket>, updates: string[] }} Room
 * @typedef {{ type?: string, room?: string, clientId?: string | number, state?: string, awareness?: unknown, update?: string }} TestMessage
 */

const DEFAULT_PORT = 18991;
const PORT = parsePortArg();
/** @type {Map<string, Room>} */
const rooms = new Map();

function parsePortArg() {
	const portIndex = process.argv.indexOf( '--port' );
	const rawPort =
		portIndex === -1
			? process.env.GUTENBERG_RTC_TEST_WS_PORT
			: process.argv[ portIndex + 1 ];

	if ( ! rawPort ) {
		return DEFAULT_PORT;
	}

	const port = Number.parseInt( rawPort, 10 );
	if ( ! Number.isInteger( port ) || port <= 0 ) {
		throw new Error( `Invalid port: ${ rawPort }` );
	}
	return port;
}

/**
 * @param {string} roomName Room name.
 * @return {Room} Matching room.
 */
function getRoom( roomName ) {
	let room = rooms.get( roomName );
	if ( ! room ) {
		room = {
			awareness: new Map(),
			clients: new Set(),
			updates: [],
		};
		rooms.set( roomName, room );
	}
	return room;
}

/**
 * @param {TestSocket}              socket  WebSocket client.
 * @param {Record<string, unknown>} payload JSON payload.
 */
function sendJson( socket, payload ) {
	if ( socket.readyState !== socket.OPEN ) {
		return;
	}
	socket.send( JSON.stringify( payload ) );
}

/**
 * @param {Room}                    room         Room to broadcast to.
 * @param {Record<string, unknown>} payload      JSON payload.
 * @param {TestSocket | null}       exceptSocket Socket to skip.
 */
function broadcastJson( room, payload, exceptSocket = null ) {
	for ( const client of room.clients ) {
		if ( client !== exceptSocket ) {
			sendJson( client, payload );
		}
	}
}

/**
 * @param {TestSocket} socket WebSocket client.
 */
function removeSocketFromRooms( socket ) {
	for ( const [ roomName, room ] of rooms ) {
		if ( ! room.clients.delete( socket ) ) {
			continue;
		}

		if ( socket.clientId ) {
			room.awareness.delete( String( socket.clientId ) );
			broadcastJson( room, {
				type: 'remove-awareness',
				room: roomName,
				clientIds: [ socket.clientId ],
			} );
		}
	}
}

/**
 * @param {Room} room Room to read.
 * @return {Record<string, unknown>} Serialized awareness by client ID.
 */
function roomAwarenessObject( room ) {
	return Object.fromEntries( room.awareness.entries() );
}

/**
 * @param {TestSocket}  socket  WebSocket client.
 * @param {TestMessage} message Parsed message.
 */
function handleJoin( socket, message ) {
	if ( ! message.room || ! message.clientId ) {
		return;
	}

	const room = getRoom( message.room );
	socket.roomName = message.room;
	socket.clientId = message.clientId;
	room.clients.add( socket );

	if ( message.state ) {
		room.updates.push( message.state );
	}
	if ( Object.prototype.hasOwnProperty.call( message, 'awareness' ) ) {
		room.awareness.set( String( message.clientId ), message.awareness );
	}

	sendJson( socket, {
		type: 'snapshot',
		room: message.room,
		updates: room.updates,
		awareness: roomAwarenessObject( room ),
	} );

	if ( message.state ) {
		broadcastJson(
			room,
			{
				type: 'update',
				room: message.room,
				clientId: message.clientId,
				update: message.state,
			},
			socket
		);
	}

	broadcastJson(
		room,
		{
			type: 'awareness',
			room: message.room,
			awareness: {
				[ message.clientId ]: message.awareness ?? {},
			},
		},
		socket
	);
}

/**
 * @param {TestSocket}  socket  WebSocket client.
 * @param {TestMessage} message Parsed message.
 */
function handleUpdate( socket, message ) {
	if ( ! socket.roomName || ! message.update ) {
		return;
	}

	const room = getRoom( socket.roomName );
	room.updates.push( message.update );
	broadcastJson(
		room,
		{
			type: 'update',
			room: socket.roomName,
			clientId: socket.clientId,
			update: message.update,
		},
		socket
	);
}

/**
 * @param {TestSocket}  socket  WebSocket client.
 * @param {TestMessage} message Parsed message.
 */
function handleAwareness( socket, message ) {
	if ( ! socket.roomName ) {
		return;
	}

	const room = getRoom( socket.roomName );
	if ( message.awareness === null ) {
		room.awareness.delete( String( socket.clientId ) );
		broadcastJson( room, {
			type: 'remove-awareness',
			room: socket.roomName,
			clientIds: [ socket.clientId ],
		} );
		return;
	}

	room.awareness.set( String( socket.clientId ), message.awareness ?? {} );
	broadcastJson( room, {
		type: 'awareness',
		room: socket.roomName,
		awareness: {
			[ String( socket.clientId ) ]: message.awareness ?? {},
		},
	} );
}

/**
 * @param {TestSocket} socket     WebSocket client.
 * @param {RawData}    rawMessage Raw WebSocket message.
 */
function handleMessage( socket, rawMessage ) {
	let message;
	try {
		message = JSON.parse( rawMessage.toString() );
	} catch {
		return;
	}

	switch ( message.type ) {
		case 'join':
			handleJoin( socket, message );
			break;
		case 'update':
			handleUpdate( socket, message );
			break;
		case 'awareness':
			handleAwareness( socket, message );
			break;
		case 'leave':
			removeSocketFromRooms( socket );
			break;
	}
}

function reset() {
	for ( const room of rooms.values() ) {
		for ( const client of room.clients ) {
			client.close( 1001, 'reset' );
		}
	}
	rooms.clear();
}

const server = http.createServer( ( request, response ) => {
	if ( request.url === '/health' ) {
		response.writeHead( 200, { 'content-type': 'application/json' } );
		response.end(
			JSON.stringify( {
				name: 'gutenberg-rtc-test-ws-sync-server',
				ok: true,
				port: PORT,
				rooms: rooms.size,
			} )
		);
		return;
	}

	if ( request.method === 'POST' && request.url === '/reset' ) {
		reset();
		response.writeHead( 204 );
		response.end();
		return;
	}

	response.writeHead( 404, { 'content-type': 'application/json' } );
	response.end( JSON.stringify( { ok: false } ) );
} );

const wss = new WebSocketServer( { server } );
wss.on( 'connection', ( socket ) => {
	socket.on( 'message', ( message ) => handleMessage( socket, message ) );
	socket.on( 'close', () => removeSocketFromRooms( socket ) );
	socket.on( 'error', () => removeSocketFromRooms( socket ) );
} );

server.listen( PORT, '127.0.0.1', () => {
	process.stdout.write(
		`gutenberg-rtc-test-ws-sync-server listening on 127.0.0.1:${ PORT }\n`
	);
} );

function shutdown() {
	reset();
	wss.close();
	server.close( () => process.exit( 0 ) );
	setTimeout( () => process.exit( 0 ), 500 ).unref();
}

process.on( 'SIGINT', shutdown );
process.on( 'SIGTERM', shutdown );
