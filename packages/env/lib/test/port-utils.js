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

describe( 'port-utils', () => {
	describe( 'isPortAvailable', () => {
		it( 'returns true for an available port', async () => {
			// Use a high port that's unlikely to be in use
			const result = await isPortAvailable( 59999 );
			expect( result ).toBe( true );
		} );

		it( 'returns false for a port in use', async () => {
			// Start a server on a port
			const server = net.createServer();
			const port = 59998;

			await new Promise( ( resolve ) => {
				server.listen( port, '0.0.0.0', resolve );
			} );

			try {
				const result = await isPortAvailable( port );
				expect( result ).toBe( false );
			} finally {
				await new Promise( ( resolve ) => {
					server.close( resolve );
				} );
			}
		} );
	} );

	describe( 'findAvailablePort', () => {
		it( 'returns the preferred port when available', async () => {
			const preferredPort = 59997;
			const result = await findAvailablePort( { preferredPort } );
			expect( result ).toBe( preferredPort );
		} );

		it( 'finds an alternative when preferred port is busy', async () => {
			const preferredPort = 59996;

			// Occupy the preferred port
			const server = net.createServer();
			await new Promise( ( resolve ) => {
				server.listen( preferredPort, '0.0.0.0', resolve );
			} );

			try {
				const result = await findAvailablePort( {
					preferredPort,
					min: 59990,
					max: 59999,
				} );
				expect( result ).not.toBe( preferredPort );
				expect( result ).toBeGreaterThanOrEqual( 59990 );
				expect( result ).toBeLessThanOrEqual( 59999 );
			} finally {
				await new Promise( ( resolve ) => {
					server.close( resolve );
				} );
			}
		} );

		it( 'respects minimum port constraint', async () => {
			const result = await findAvailablePort( {
				preferredPort: 1000,
				min: 59990,
				max: 59999,
			} );
			expect( result ).toBeGreaterThanOrEqual( 59990 );
			expect( result ).toBeLessThanOrEqual( 59999 );
		} );

		it( 'respects maximum port constraint', async () => {
			const result = await findAvailablePort( {
				preferredPort: 60000,
				min: 59990,
				max: 59999,
			} );
			expect( result ).toBeGreaterThanOrEqual( 59990 );
			expect( result ).toBeLessThanOrEqual( 59999 );
		} );

		it( 'excludes specified ports', async () => {
			const preferredPort = 59995;
			const result = await findAvailablePort( {
				preferredPort,
				exclude: [ 59995 ],
				min: 59990,
				max: 59999,
			} );
			expect( result ).not.toBe( 59995 );
			expect( result ).toBeGreaterThanOrEqual( 59990 );
			expect( result ).toBeLessThanOrEqual( 59999 );
		} );

		it( 'throws when no port is available in range', async () => {
			// Occupy all ports in a tiny range
			const servers = [];
			const minPort = 59980;
			const maxPort = 59982;

			for ( let port = minPort; port <= maxPort; port++ ) {
				const server = net.createServer();
				await new Promise( ( resolve ) => {
					server.listen( port, '0.0.0.0', resolve );
				} );
				servers.push( server );
			}

			try {
				await expect(
					findAvailablePort( {
						preferredPort: minPort,
						min: minPort,
						max: maxPort,
					} )
				).rejects.toThrow( /No available port found/ );
			} finally {
				for ( const server of servers ) {
					await new Promise( ( resolve ) => {
						server.close( resolve );
					} );
				}
			}
		} );

		it( 'uses default range when min/max not specified', async () => {
			const result = await findAvailablePort( {
				preferredPort: 59994,
			} );
			expect( result ).toBeGreaterThanOrEqual( DEFAULT_MIN_PORT );
			expect( result ).toBeLessThanOrEqual( DEFAULT_MAX_PORT );
		} );
	} );
} );
