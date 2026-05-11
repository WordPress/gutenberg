'use strict';
/**
 * Internal dependencies
 */
const {
	createPortResolver,
	resolveConfigPorts,
} = require( '../resolve-available-ports' );
const { findAvailablePort, isPortAvailable } = require( '../port-utils' );

jest.mock( '../port-utils' );

describe( 'resolve-available-ports', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'createPortResolver', () => {
		it( 'should resolve a port in non-strict mode', async () => {
			findAvailablePort.mockResolvedValue( 8888 );

			const resolver = createPortResolver();
			const port = await resolver.resolve( 8888, 'env.development.port' );

			expect( port ).toBe( 8888 );
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8888 } )
			);
		} );

		it( 'should fail in strict mode when port is busy', async () => {
			isPortAvailable.mockResolvedValue( false );

			const resolver = createPortResolver();

			await expect(
				resolver.resolve( 9000, 'env.development.port', true )
			).rejects.toThrow( /Port 9000.*is busy/ );
		} );

		it( 'should succeed in strict mode when port is available', async () => {
			isPortAvailable.mockResolvedValue( true );

			const resolver = createPortResolver();
			const port = await resolver.resolve(
				9000,
				'env.development.port',
				true
			);

			expect( port ).toBe( 9000 );
		} );

		it( 'should fail in strict mode when port conflicts with another service', async () => {
			isPortAvailable.mockResolvedValue( true );
			findAvailablePort.mockResolvedValue( 8888 );

			const resolver = createPortResolver();
			// First call consumes port 8888.
			await resolver.resolve( 8888, 'env.development.port' );

			await expect(
				resolver.resolve( 8888, 'env.tests.port', true )
			).rejects.toThrow( /conflicts with another wp-env service/ );
		} );
	} );

	describe( 'resolveConfigPorts', () => {
		it( 'should resolve null ports using preferred defaults', async () => {
			findAvailablePort.mockResolvedValue( 8888 );

			const resolver = createPortResolver();
			const config = {
				env: {
					development: { port: null },
					tests: { port: null },
				},
			};

			await resolveConfigPorts( config, resolver );

			// Null ports should be resolved using preferred ports.
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8888 } )
			);
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8889 } )
			);
		} );

		it( 'should resolve explicit ports with auto-fallback', async () => {
			findAvailablePort.mockImplementation( ( { preferredPort } ) =>
				Promise.resolve( preferredPort )
			);

			const resolver = createPortResolver();
			const config = {
				env: {
					development: { port: 9000 },
					tests: { port: 9001 },
				},
			};

			await resolveConfigPorts( config, resolver );

			expect( config.env.development.port ).toBe( 9000 );
			expect( config.env.tests.port ).toBe( 9001 );
			// Auto-port always uses findAvailablePort (non-strict).
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 9000 } )
			);
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 9001 } )
			);
		} );

		it( 'should resolve explicit phpmyadminPort with auto-fallback', async () => {
			findAvailablePort.mockResolvedValue( 49152 );

			const resolver = createPortResolver();
			const config = {
				env: {
					development: { port: null, phpmyadminPort: 9000 },
					tests: { port: null },
				},
			};

			await resolveConfigPorts( config, resolver );

			// phpmyadminPort should use findAvailablePort (non-strict),
			// not isPortAvailable (strict), even with an explicit value.
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 9000 } )
			);
			expect( isPortAvailable ).not.toHaveBeenCalledWith( 9000 );
		} );

		it( 'should skip undefined ports', async () => {
			const resolver = createPortResolver();
			const config = {
				env: {
					development: { port: null },
					tests: { port: null },
				},
			};

			findAvailablePort.mockResolvedValue( 8888 );
			await resolveConfigPorts( config, resolver );

			// phpmyadminPort is undefined so should not trigger any resolution.
			expect( config.env.development.phpmyadminPort ).toBeUndefined();
			expect( config.env.tests.phpmyadminPort ).toBeUndefined();
		} );
	} );
} );
