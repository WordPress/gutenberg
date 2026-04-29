'use strict';
/**
 * External dependencies
 */
const net = require( 'net' );

/**
 * Internal dependencies
 */
const {
	isPortAvailable,
	findAvailablePort,
	DEFAULT_MIN_PORT,
	DEFAULT_MAX_PORT,
} = require( '../port-utils' );

jest.mock( 'net' );

describe( 'port-utils', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	/**
	 * Helper that configures net.createServer to return fresh mock servers.
	 * Takes a function that receives the port and returns true if available.
	 *
	 * @param {Function} isAvailable A function (port) => boolean.
	 */
	function mockPortAvailability( isAvailable ) {
		net.createServer.mockImplementation( () => {
			let errorCb, listenCb;

			const server = {
				once: jest.fn( ( event, cb ) => {
					if ( event === 'error' ) {
						errorCb = cb;
					}
					if ( event === 'listening' ) {
						listenCb = cb;
					}
				} ),
				listen: jest.fn( ( port ) => {
					if ( isAvailable( port ) ) {
						server.close.mockImplementation( ( cb ) => cb() );
						listenCb();
					} else {
						errorCb( { code: 'EADDRINUSE' } );
					}
				} ),
				close: jest.fn(),
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
			net.createServer.mockImplementation( () => {
				let errorCb;
				const server = {
					once: jest.fn( ( event, cb ) => {
						if ( event === 'error' ) {
							errorCb = cb;
						}
					} ),
					listen: jest.fn( () => {
						errorCb( { code: 'EACCES' } );
					} ),
					close: jest.fn(),
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
