/**
 * External dependencies
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	websocketManager,
	resetWebSocketManagerForTesting,
} from '../websocket-manager';
import type { EngineSessionCodec } from '../../../types';

jest.mock( '@wordpress/api-fetch' );

// A minimal fake WebSocket capturing sends and exposing lifecycle triggers.
class FakeWebSocket {
	static instances: FakeWebSocket[] = [];
	static OPEN = 1;
	public readyState = 0;
	public sent: string[] = [];
	private listeners: Record< string, ( ( e: unknown ) => void )[] > = {};

	public constructor( public url: string ) {
		FakeWebSocket.instances.push( this );
	}
	public addEventListener( type: string, cb: ( e: unknown ) => void ): void {
		( this.listeners[ type ] ??= [] ).push( cb );
	}
	public send( data: string ): void {
		this.sent.push( data );
	}
	public close(): void {
		this.readyState = 3;
		this.emit( 'close', {} );
	}
	public open(): void {
		this.readyState = FakeWebSocket.OPEN;
		this.emit( 'open', {} );
	}
	public receive( data: unknown ): void {
		this.emit( 'message', { data: JSON.stringify( data ) } );
	}
	private emit( type: string, e: unknown ): void {
		( this.listeners[ type ] ?? [] ).forEach( ( cb ) => cb( e ) );
	}
}

function fakeSession(
	overrides: Partial< EngineSessionCodec > = {}
): EngineSessionCodec {
	let localListener: ( ( u: unknown ) => void ) | null = null;
	return {
		clientId: 101,
		engineSlug: 'intent-log',
		engineProtocol: 1,
		getInitialUpdates: () => [],
		onLocalUpdate: ( cb: ( u: unknown ) => void ) => {
			localListener = cb;
		},
		emitLocal: ( u: unknown ) => localListener?.( u ),
		receiveUpdate: jest.fn< ( update: unknown ) => undefined >(),
		receiveDispositions: jest.fn(),
		getLocalAwareness: () => ( {} ),
		applyRemoteAwareness: jest.fn(),
		createCompactionUpdate: () => ( { type: 'c', data: '' } ),
		destroy: jest.fn(),
		...overrides,
	} as unknown as EngineSessionCodec;
}

describe( 'websocket manager', () => {
	afterEach( () => {
		resetWebSocketManagerForTesting();
		FakeWebSocket.instances = [];
		delete window._wpCollaborationWebSocketUrl;
		( apiFetch as unknown as jest.Mock ).mockReset();
	} );

	const setup = () => {
		window._wpCollaborationWebSocketUrl = 'ws://localhost:8787';
		( window as unknown as { WebSocket: unknown } ).WebSocket =
			FakeWebSocket as unknown;
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			token: 't0ken',
		} as never );
	};

	it( 'fetches a token, connects to the announced URL, and sends the initial sync', async () => {
		setup();
		const session = fakeSession();
		const onStatusChange = jest.fn();

		websocketManager.registerRoom( {
			room: 'postType/post:1',
			session,
			onStatusChange,
		} );
		// Let the token promise resolve.
		await Promise.resolve();
		await Promise.resolve();

		const ws = FakeWebSocket.instances[ 0 ];
		expect( ws ).toBeDefined();
		expect( ws.url ).toContain( 'token=t0ken' );

		ws.open();
		expect( onStatusChange ).toHaveBeenCalledWith( {
			status: 'connected',
		} );
		// The initial sync frame carries the room, cursor, and engine stamp.
		const frame = JSON.parse( ws.sent[ 0 ] );
		expect( frame.type ).toBe( 'sync' );
		expect( frame.rooms[ 0 ] ).toMatchObject( {
			room: 'postType/post:1',
			after: 0,
			client_id: 101,
			engine: 'intent-log',
		} );
	} );

	it( 'feeds pushed updates to the codec and advances the cursor', async () => {
		setup();
		const receiveUpdate = jest.fn< ( update: unknown ) => undefined >();
		const session = fakeSession( {
			receiveUpdate,
		} as Partial< EngineSessionCodec > );

		websocketManager.registerRoom( {
			room: 'postType/post:1',
			session,
			onStatusChange: jest.fn(),
		} );
		await Promise.resolve();
		await Promise.resolve();
		const ws = FakeWebSocket.instances[ 0 ];
		ws.open();
		ws.sent = [];

		// The server pushes a peer's update.
		ws.receive( {
			type: 'sync',
			rooms: [
				{
					room: 'postType/post:1',
					awareness: { 2: {} },
					updates: [ { type: 'intent', data: 'AAAA' } ],
					end_cursor: 7,
				},
			],
		} );

		expect( receiveUpdate ).toHaveBeenCalledWith( {
			type: 'intent',
			data: 'AAAA',
		} );
		expect( session.applyRemoteAwareness ).toHaveBeenCalledWith( {
			2: {},
		} );

		// The next outgoing frame carries the advanced cursor.
		(
			session as unknown as { emitLocal: ( u: unknown ) => void }
		 ).emitLocal( { type: 'intent', data: 'BBBB' } );
		const frame = JSON.parse( ws.sent.at( -1 ) as string );
		expect( frame.rooms[ 0 ].after ).toBe( 7 );
		expect( frame.rooms[ 0 ].updates ).toEqual( [
			{ type: 'intent', data: 'BBBB' },
		] );
	} );

	it( 'closes the socket when the last room unregisters', async () => {
		setup();
		websocketManager.registerRoom( {
			room: 'postType/post:1',
			session: fakeSession(),
			onStatusChange: jest.fn(),
		} );
		await Promise.resolve();
		await Promise.resolve();
		const ws = FakeWebSocket.instances[ 0 ];
		ws.open();

		websocketManager.unregisterRoom( 'postType/post:1' );
		expect( ws.readyState ).toBe( 3 );
	} );
} );
