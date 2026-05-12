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

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'all',
			} );

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

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'all',
			} );

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

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'all',
			} );

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
			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'all',
			} );

			// phpmyadminPort is undefined so should not trigger any resolution.
			expect( config.env.development.phpmyadminPort ).toBeUndefined();
			expect( config.env.tests.phpmyadminPort ).toBeUndefined();
		} );

		it( 'under autoPortMode=defaults-only uses strict mode for non-default-origin ports and non-strict for default-origin ports', async () => {
			findAvailablePort.mockImplementation( ( { preferredPort } ) =>
				Promise.resolve( preferredPort )
			);
			isPortAvailable.mockResolvedValue( true );

			const resolver = createPortResolver();
			const config = {
				env: {
					development: { port: 8888 },
					tests: { port: 9001 },
				},
			};

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'defaults-only',
				defaultOriginPorts: new Set( [ 'development.port' ] ),
			} );

			// Default-origin development port → non-strict (findAvailablePort).
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8888 } )
			);
			// User-set tests port → strict (isPortAvailable).
			expect( isPortAvailable ).toHaveBeenCalledWith( 9001 );
		} );

		it( 'under autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)', async () => {
			findAvailablePort.mockImplementation( ( { preferredPort } ) =>
				Promise.resolve( preferredPort )
			);
			isPortAvailable.mockResolvedValue( true );

			const resolver = createPortResolver();
			const config = {
				env: {
					development: {
						port: 8888,
						phpmyadminPort: 8080,
					},
					tests: { port: 8889 },
				},
			};

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'defaults-only',
				defaultOriginPorts: new Set( [
					'development.port',
					'tests.port',
				] ),
			} );

			// HTTP ports were resolved.
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8888 } )
			);
			// phpmyadminPort was NOT resolved through either path.
			expect( findAvailablePort ).not.toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8080 } )
			);
			expect( isPortAvailable ).not.toHaveBeenCalledWith( 8080 );
			// And its value is left untouched.
			expect( config.env.development.phpmyadminPort ).toEqual( 8080 );
		} );

		it( 'under autoPortMode=all uses non-strict mode for all ports including phpmyadminPort', async () => {
			findAvailablePort.mockImplementation( ( { preferredPort } ) =>
				Promise.resolve( preferredPort )
			);

			const resolver = createPortResolver();
			const config = {
				env: {
					development: {
						port: 8888,
						phpmyadminPort: 8080,
					},
					tests: { port: 8889 },
				},
			};

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'all',
			} );

			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8888 } )
			);
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8889 } )
			);
			expect( findAvailablePort ).toHaveBeenCalledWith(
				expect.objectContaining( { preferredPort: 8080 } )
			);
			expect( isPortAvailable ).not.toHaveBeenCalled();
		} );

		it( 'under autoPortMode=off uses strict mode for HTTP ports and still resolves phpmyadminPort strictly', async () => {
			isPortAvailable.mockResolvedValue( true );

			const resolver = createPortResolver();
			const config = {
				env: {
					development: {
						port: 8888,
						phpmyadminPort: 8080,
					},
					tests: { port: 8889 },
				},
			};

			await resolveConfigPorts( config, resolver, {
				autoPortMode: 'off',
			} );

			expect( isPortAvailable ).toHaveBeenCalledWith( 8888 );
			expect( isPortAvailable ).toHaveBeenCalledWith( 8889 );
			expect( isPortAvailable ).toHaveBeenCalledWith( 8080 );
			expect( findAvailablePort ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'createPortResolver moved-port notice (R11 / AC7)', () => {
		const stubSpinner = () => ( {
			text: '',
			info: jest.fn(),
			start: jest.fn(),
		} );

		it( 'emits spinner.info exactly once when fallback occurs and re-arms the spinner', async () => {
			findAvailablePort.mockResolvedValue( 8890 );
			const spinner = stubSpinner();

			const resolver = createPortResolver( spinner );
			await resolver.resolve( 8888, 'env.development.port' );

			expect( spinner.info ).toHaveBeenCalledTimes( 1 );
			expect( spinner.info.mock.calls[ 0 ][ 0 ] ).toMatch(
				/8888.*busy.*8890/i
			);
			// Spinner is re-armed after the info notice (matches the
			// existing `spinner.warn(...); spinner.start();` precedent in
			// commands/start.js).
			expect( spinner.start ).toHaveBeenCalled();
			expect( spinner.info.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
				spinner.start.mock.invocationCallOrder[ 0 ]
			);
		} );

		it( 'does NOT emit spinner.info when the preferred port is available (no move occurred)', async () => {
			// findAvailablePort returns the preferred port itself —
			// signalling no fallback was needed.
			findAvailablePort.mockResolvedValue( 8888 );
			const spinner = stubSpinner();

			const resolver = createPortResolver( spinner );
			await resolver.resolve( 8888, 'env.development.port' );

			expect( spinner.info ).not.toHaveBeenCalled();
		} );

		it( 'does NOT emit spinner.info on the strict failure path', async () => {
			isPortAvailable.mockResolvedValue( false );
			const spinner = stubSpinner();

			const resolver = createPortResolver( spinner );
			await expect(
				resolver.resolve( 9000, 'env.development.port', true )
			).rejects.toThrow( /Port 9000.*is busy/ );

			expect( spinner.info ).not.toHaveBeenCalled();
		} );

		it( 'does not write to console or process.stdout when fallback occurs (regression guard)', async () => {
			findAvailablePort.mockResolvedValue( 8890 );

			const consoleLog = jest
				.spyOn( console, 'log' )
				.mockImplementation( () => {} );
			const consoleInfo = jest
				.spyOn( console, 'info' )
				.mockImplementation( () => {} );
			const consoleWarn = jest
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );
			const stdoutWrite = jest
				.spyOn( process.stdout, 'write' )
				.mockImplementation( () => true );

			try {
				const resolver = createPortResolver( stubSpinner() );
				await resolver.resolve( 8888, 'env.development.port' );

				// AC7: introducing a separate output channel would be a
				// detectable regression. None of these were called.
				expect( consoleLog ).not.toHaveBeenCalled();
				expect( consoleInfo ).not.toHaveBeenCalled();
				expect( consoleWarn ).not.toHaveBeenCalled();
				expect( stdoutWrite ).not.toHaveBeenCalled();
			} finally {
				consoleLog.mockRestore();
				consoleInfo.mockRestore();
				consoleWarn.mockRestore();
				stdoutWrite.mockRestore();
			}
		} );

		it( 'suppresses the notice silently when no spinner is provided (test-path safety)', async () => {
			findAvailablePort.mockResolvedValue( 8890 );

			const consoleLog = jest
				.spyOn( console, 'log' )
				.mockImplementation( () => {} );
			const consoleInfo = jest
				.spyOn( console, 'info' )
				.mockImplementation( () => {} );

			try {
				// No spinner argument — must not throw and must not
				// silently log to console as a fallback channel.
				const resolver = createPortResolver();
				await expect(
					resolver.resolve( 8888, 'env.development.port' )
				).resolves.toEqual( 8890 );

				expect( consoleLog ).not.toHaveBeenCalled();
				expect( consoleInfo ).not.toHaveBeenCalled();
			} finally {
				consoleLog.mockRestore();
				consoleInfo.mockRestore();
			}
		} );
	} );
} );
