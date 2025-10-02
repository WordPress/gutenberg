/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type * as Y from 'yjs';

// Mock WebrtcProviderWithHttpSignaling
const mockWebrtcProvider = {
	destroy: jest.fn(),
};

jest.mock( '../webrtc-http-stream-signaling', () => {
	return {
		WebrtcProviderWithHttpSignaling: jest
			.fn()
			.mockImplementation( () => mockWebrtcProvider ),
	};
} );

// Mock yjs
const mockYDoc = {
	clientID: 12345,
	meta: new Map(),
	getMap: jest.fn(),
	transact: jest.fn( ( fn: () => void ) => fn() ),
	destroy: jest.fn(),
};

jest.mock( 'yjs', () => ( {
	Doc: jest.fn().mockImplementation( () => mockYDoc ),
} ) );

/**
 * Internal dependencies
 */
import {
	createWebRTCConnection,
	type WebRTCConnectionConfig,
} from '../create-webrtc-connection';

describe( 'createWebRTCConnection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'configuration', () => {
		it( 'creates a connection function with signaling servers', () => {
			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
			};

			const connectDoc = createWebRTCConnection( config );

			expect( typeof connectDoc ).toBe( 'function' );
		} );

		it( 'accepts password in configuration', () => {
			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
				password: 'test-password',
			};

			const connectDoc = createWebRTCConnection( config );

			expect( typeof connectDoc ).toBe( 'function' );
		} );

		it( 'accepts multiple signaling servers', () => {
			const config: WebRTCConnectionConfig = {
				signaling: [
					'ws://localhost:4444',
					'ws://localhost:5555',
					'wss://example.com/signaling',
				],
			};

			const connectDoc = createWebRTCConnection( config );

			expect( typeof connectDoc ).toBe( 'function' );
		} );
	} );

	describe( 'connection function', () => {
		it( 'creates WebrtcProvider with correct room name', async () => {
			const { WebrtcProviderWithHttpSignaling } = jest.requireMock(
				'../webrtc-http-stream-signaling'
			) as {
				WebrtcProviderWithHttpSignaling: jest.Mock;
			};

			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
			};

			const connectDoc = createWebRTCConnection( config );
			await connectDoc( '123', 'post', mockYDoc as unknown as Y.Doc );

			expect( WebrtcProviderWithHttpSignaling ).toHaveBeenCalledWith(
				'post-123',
				mockYDoc,
				expect.objectContaining( {
					signaling: [ 'ws://localhost:4444' ],
				} )
			);
		} );

		it( 'passes password to WebrtcProvider', async () => {
			const { WebrtcProviderWithHttpSignaling } = jest.requireMock(
				'../webrtc-http-stream-signaling'
			) as {
				WebrtcProviderWithHttpSignaling: jest.Mock;
			};

			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
				password: 'secret-password',
			};

			const connectDoc = createWebRTCConnection( config );
			await connectDoc( '456', 'page', mockYDoc as unknown as Y.Doc );

			expect( WebrtcProviderWithHttpSignaling ).toHaveBeenCalledWith(
				'page-456',
				mockYDoc,
				expect.objectContaining( {
					signaling: [ 'ws://localhost:4444' ],
					password: 'secret-password',
				} )
			);
		} );

		it( 'returns promise with destroy method', async () => {
			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
			};

			const connectDoc = createWebRTCConnection( config );
			const result = await connectDoc(
				'789',
				'post',
				mockYDoc as unknown as Y.Doc
			);

			expect( result ).toBeDefined();
			expect( typeof result.destroy ).toBe( 'function' );
		} );

		it( 'destroy method is a no-op', async () => {
			const config: WebRTCConnectionConfig = {
				signaling: [ 'ws://localhost:4444' ],
			};

			const connectDoc = createWebRTCConnection( config );
			const result = await connectDoc(
				'100',
				'post',
				mockYDoc as unknown as Y.Doc
			);

			// Should not throw
			expect( () => result.destroy() ).not.toThrow();
		} );
	} );
} );
