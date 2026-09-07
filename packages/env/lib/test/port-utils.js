import { createRequire } from 'node:module';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const net = require( 'node:net' );
const createServer = vi
	.spyOn( net, 'createServer' )
	.mockImplementation( () => undefined );
const {
	isPortAvailable,
	findAvailablePort,
	DEFAULT_MIN_PORT,
	DEFAULT_MAX_PORT,
} = require( '../port-utils' );

afterAll( () => {
	vi.restoreAllMocks();
} );

describe( 'port-utils', () => {
	beforeEach( () => {
		createServer.mockReset().mockImplementation( () => undefined );
	} );

	/**
	 * Helper that configures net.createServer to return fresh mock servers.
	 * Takes a function that receives the port and returns true if available.
	 *
	 * @param {Function} isAvailable A function (port) => boolean.
	 */
	function mockPortAvailability( isAvailable ) {
		createServer.mockImplementation( () => {
			let errorCb, listenCb;

			const server = {
				once: vi.fn( ( event, cb ) => {
					if ( event === 'error' ) {
						errorCb = cb;
					}
					if ( event === 'listening' ) {
						listenCb = cb;
					}
				} ),
				listen: vi.fn( ( port ) => {
					if ( isAvailable( port ) ) {
						server.close.mockImplementation( ( cb ) => cb() );
						listenCb();
					} else {
						errorCb( { code: 'EADDRINUSE' } );
					}
				} ),
				close: vi.fn(),
			};

			return server;
		} );
	}

	describe( 'isPortAvailable', () => {
		it( 'returns true for an available port', async () => {
			mockPortAvailability( () => true );
			const result = await isPortAvailable( 8888 );
			expect( result ).toBe( true );
		} );

		it( 'returns false for a port in use', async () => {
			mockPortAvailability( () => false );
			const result = await isPortAvailable( 8888 );
			expect( result ).toBe( false );
		} );

		it( 'returns false for EACCES error', async () => {
			createServer.mockImplementation( () => {
				let errorCb;
				const server = {
					once: vi.fn( ( event, cb ) => {
						if ( event === 'error' ) {
							errorCb = cb;
						}
					} ),
					listen: vi.fn( () => {
						errorCb( { code: 'EACCES' } );
					} ),
					close: vi.fn(),
				};
				return server;
			} );
			const result = await isPortAvailable( 80 );
			expect( result ).toBe( false );
		} );
	} );

	describe( 'findAvailablePort', () => {
		it( 'returns the preferred port when available', async () => {
			mockPortAvailability( () => true );
			const result = await findAvailablePort( {
				preferredPort: 8888,
			} );
			expect( result ).toBe( 8888 );
		} );

		it( 'finds an alternative when preferred port is busy', async () => {
			mockPortAvailability( ( port ) => port !== 8888 );
			const result = await findAvailablePort( {
				preferredPort: 8888,
			} );
			expect( result ).toBe( 8889 );
		} );

		it( 'excludes specified ports', async () => {
			mockPortAvailability( () => true );
			const result = await findAvailablePort( {
				preferredPort: 8888,
				exclude: [ 8888 ],
			} );
			expect( result ).toBe( 8889 );
		} );

		it( 'returns a port higher than the preferred port when fallback is needed', async () => {
			mockPortAvailability( ( port ) => port !== 8888 && port !== 8889 );
			const result = await findAvailablePort( {
				preferredPort: 8888,
			} );
			expect( result ).toBeGreaterThan( 8888 );
			expect( result ).toBeLessThanOrEqual( DEFAULT_MAX_PORT );
		} );

		it( 'supports overriding fallback range', async () => {
			mockPortAvailability( ( port ) => port === DEFAULT_MIN_PORT + 1 );
			const result = await findAvailablePort( {
				preferredPort: 8888,
				minPort: DEFAULT_MIN_PORT,
			} );
			expect( result ).toBe( DEFAULT_MIN_PORT + 1 );
		} );
	} );
} );
