/**
 * External dependencies
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

jest.mock( '../connect-indexdb', () => ( {
	connectIndexDb: jest.fn(),
} ) );

jest.mock( '../create-webrtc-connection', () => ( {
	createWebRTCConnection: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { getWebRTCSyncProvider, SyncProvider } from '../index';

describe( 'index', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getWebRTCSyncProvider', () => {
		it( 'creates a SyncProvider instance', () => {
			const provider = getWebRTCSyncProvider();

			expect( provider ).toBeInstanceOf( SyncProvider );
		} );

		it( 'calls createWebRTCConnection with window settings', () => {
			const { createWebRTCConnection } = jest.requireMock(
				'../create-webrtc-connection'
			) as { createWebRTCConnection: jest.Mock };

			getWebRTCSyncProvider();

			expect( createWebRTCConnection ).toHaveBeenCalledWith(
				expect.objectContaining( {
					password: undefined,
					signaling: expect.arrayContaining( [ undefined ] ),
				} )
			);
		} );

		it( 'uses __experimentalCollaborativeEditingSecret and wp.ajax.settings.url when available', () => {
			const { createWebRTCConnection } = jest.requireMock(
				'../create-webrtc-connection'
			) as { createWebRTCConnection: jest.Mock };

			globalThis.window.__experimentalCollaborativeEditingSecret =
				'test-secret';
			globalThis.window.wp = {
				ajax: { settings: { url: 'https://example.com' } },
			};

			getWebRTCSyncProvider();

			expect( createWebRTCConnection ).toHaveBeenCalledWith(
				expect.objectContaining( {
					password: 'test-secret',
					signaling: expect.arrayContaining( [
						'https://example.com',
					] ),
				} )
			);

			delete ( globalThis.window as any )
				.__experimentalCollaborativeEditingSecret;
			delete ( globalThis.window as any ).wp;
		} );

		it( 'creates new provider instance on each call', () => {
			const provider1 = getWebRTCSyncProvider();
			const provider2 = getWebRTCSyncProvider();

			expect( provider1 ).not.toBe( provider2 );
		} );

		it( 'handles missing window.wp gracefully', () => {
			const { createWebRTCConnection } = jest.requireMock(
				'../create-webrtc-connection'
			) as { createWebRTCConnection: jest.Mock };

			expect( () => getWebRTCSyncProvider() ).not.toThrow();

			expect( createWebRTCConnection ).toHaveBeenCalledWith(
				expect.objectContaining( {
					signaling: expect.arrayContaining( [ undefined ] ),
				} )
			);
		} );
	} );
} );
