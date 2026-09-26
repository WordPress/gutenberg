#!/usr/bin/env node

/**
 * Local-only WebSocket sync server for Gutenberg RTC e2e tests.
 *
 * Built on @y/websocket-server so the test harness exercises the same
 * y-protocol wire format as the production broker. No auth, no metrics,
 * no persistence. /reset closes every live connection and drops the
 * server's in-memory document map so each test starts clean.
 */

import http from 'node:http';
import process from 'node:process';
import {
	docs,
	setPersistence,
	setupWSConnection,
} from '@y/websocket-server/utils';
import { WebSocketServer } from 'ws';

/**
 * @typedef {import('node:http').ServerResponse} ServerResponse
 */

const DEFAULT_PORT = 18991;
const PORT = parsePortArg();
const RTC_WS_DELAY = Number.parseInt( process.env.RTC_WS_DELAY || '0', 10 );

if ( ! Number.isInteger( RTC_WS_DELAY ) || RTC_WS_DELAY < 0 ) {
	throw new Error( `Invalid RTC_WS_DELAY: ${ process.env.RTC_WS_DELAY }` );
}

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

// Noop persistence so y-websocket-server still evicts documents from
// memory once their last client disconnects.
setPersistence( {
	bindState: () => {},
	writeState: async () => {},
	provider: null,
} );

const wss = new WebSocketServer( { noServer: true } );

wss.on( 'connection', ( ws, request ) => {
	if ( RTC_WS_DELAY > 0 ) {
		const originalSend = ws.send.bind( ws );
		ws.send = ( data, ...args ) => {
			setTimeout( () => {
				if ( ws.readyState === ws.OPEN ) {
					originalSend( data, ...args );
				}
			}, RTC_WS_DELAY );
		};
	}
	setupWSConnection( ws, request );
} );

/**
 * @param {ServerResponse} response HTTP response.
 */
function reset( response ) {
	for ( const client of wss.clients ) {
		client.close( 1001, 'reset' );
	}
	docs.clear();
	response.writeHead( 204 );
	response.end();
}

const server = http.createServer( ( request, response ) => {
	const url = new URL( request.url, `http://${ request.headers.host }` );

	if ( url.pathname === '/health' ) {
		response.writeHead( 200, { 'content-type': 'application/json' } );
		response.end(
			JSON.stringify( {
				name: 'gutenberg-rtc-test-ws-sync-server',
				ok: true,
				port: PORT,
				docs: docs.size,
			} )
		);
		return;
	}

	if ( request.method === 'POST' && url.pathname === '/reset' ) {
		reset( response );
		return;
	}

	response.writeHead( 404, { 'content-type': 'application/json' } );
	response.end( JSON.stringify( { ok: false } ) );
} );

server.on( 'upgrade', ( request, socket, head ) => {
	wss.handleUpgrade( request, socket, head, ( ws ) => {
		wss.emit( 'connection', ws, request );
	} );
} );

server.listen( PORT, '127.0.0.1', () => {
	process.stdout.write(
		`gutenberg-rtc-test-ws-sync-server listening on 127.0.0.1:${ PORT }\n`
	);
} );

function shutdown() {
	for ( const client of wss.clients ) {
		client.close( 1001, 'shutdown' );
	}
	docs.clear();
	wss.close();
	server.close( () => process.exit( 0 ) );
	setTimeout( () => process.exit( 0 ), 500 ).unref();
}

process.on( 'SIGINT', shutdown );
process.on( 'SIGTERM', shutdown );
