'use strict';
/**
 * Internal dependencies
 */
const { ValidationError } = require( '..' );
const postProcessConfig = require( '../post-process-config' );

describe( 'postProcessConfig', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should merge relevant root options into environment options', async () => {
		const processed = await postProcessConfig( {
			port: 123,
			testsPort: 456,
			coreSource: {
				type: 'test',
			},
			config: {
				TESTS_ROOT: 'root',
			},
			pluginSources: [
				{
					type: 'root-plugin',
				},
			],
			themeSources: [
				{
					type: 'root-theme',
				},
			],
			mappings: {
				'root-mapping': {
					type: 'root-mapping',
				},
			},
			env: {
				development: {
					coreSource: {
						type: 'test',
					},
					config: {
						TEST_ENV: 'development',
					},
					pluginSources: [
						{
							type: 'development-plugin',
						},
					],
					themeSources: [
						{
							type: 'development-theme',
						},
					],
					mappings: {
						'development-mapping': {
							type: 'development-mapping',
						},
					},
				},
				tests: {
					coreSource: {
						type: 'test',
					},
					config: {
						TEST_ENV: 'tests',
					},
				},
			},
		} );

		expect( processed ).toEqual( {
			port: 123,
			testsPort: 456,
			coreSource: {
				type: 'test',
			},
			config: {
				TESTS_ROOT: 'root',
			},
			pluginSources: [
				{
					type: 'root-plugin',
				},
			],
			themeSources: [
				{
					type: 'root-theme',
				},
			],
			mappings: {
				'root-mapping': {
					type: 'root-mapping',
				},
			},
			env: {
				development: {
					port: 123,
					coreSource: {
						type: 'test',
					},
					config: {
						TESTS_ROOT: 'root',
						TEST_ENV: 'development',
					},
					pluginSources: [
						{
							type: 'development-plugin',
						},
					],
					themeSources: [
						{
							type: 'development-theme',
						},
					],
					mappings: {
						'root-mapping': {
							type: 'root-mapping',
						},
						'development-mapping': {
							type: 'development-mapping',
						},
					},
				},
				tests: {
					port: 456,
					coreSource: {
						type: 'test',
					},
					config: {
						TESTS_ROOT: 'root',
						TEST_ENV: 'tests',
					},
					pluginSources: [
						{
							type: 'root-plugin',
						},
					],
					themeSources: [
						{
							type: 'root-theme',
						},
					],
					mappings: {
						'root-mapping': {
							type: 'root-mapping',
						},
					},
				},
			},
		} );
	} );

	it( 'should not merge some root options into environment options', async () => {
		const processed = await postProcessConfig( {
			port: 8888,
			testsPort: 8889,
			lifecycleScripts: {
				afterStart: 'test',
			},
			env: {
				development: {},
				tests: {},
			},
		} );

		expect( processed ).toEqual( {
			port: 8888,
			testsPort: 8889,
			lifecycleScripts: {
				afterStart: 'test',
			},
			env: {
				development: {
					port: 8888,
				},
				tests: {
					port: 8889,
				},
			},
		} );
	} );

	describe( 'appendPortToWPConfigs', () => {
		it( 'should add port to certain environment config options', async () => {
			const processed = await postProcessConfig( {
				port: 123,
				config: {
					WP_TESTS_DOMAIN: 'localhost',
					WP_SITEURL: 'localhost',
					WP_HOME: 'localhost',
				},
				env: {
					development: {
						port: 123,
					},
					tests: {
						port: 456,
					},
				},
			} );

			expect( processed ).toEqual( {
				// Since the root-level config shouldn't apply to an environment,
				// we shouldn't add the port to the config options for it.
				port: 123,
				config: {
					WP_TESTS_DOMAIN: 'localhost',
					WP_SITEURL: 'localhost',
					WP_HOME: 'localhost',
				},
				env: {
					development: {
						port: 123,
						config: {
							WP_TESTS_DOMAIN: 'localhost:123',
							WP_SITEURL: 'localhost:123',
							WP_HOME: 'localhost:123',
						},
					},
					tests: {
						port: 456,
						config: {
							WP_TESTS_DOMAIN: 'localhost:456',
							WP_SITEURL: 'localhost:456',
							WP_HOME: 'localhost:456',
						},
					},
				},
			} );
		} );

		it( 'should not overwrite port in WP_HOME', async () => {
			const processed = await postProcessConfig( {
				env: {
					development: {
						port: 123,
						config: {
							WP_TESTS_DOMAIN: 'localhost:777',
							WP_SITEURL: 'localhost:777',
							WP_HOME: 'localhost:777',
						},
					},
					tests: {
						port: 456,
						config: {
							WP_TESTS_DOMAIN: 'localhost:777',
							WP_SITEURL: 'localhost:777',
							WP_HOME: 'localhost:777',
						},
					},
				},
			} );

			expect( processed ).toEqual( {
				env: {
					development: {
						port: 123,
						config: {
							WP_TESTS_DOMAIN: 'localhost:123',
							WP_SITEURL: 'localhost:123',
							WP_HOME: 'localhost:777',
						},
					},
					tests: {
						port: 456,
						config: {
							WP_TESTS_DOMAIN: 'localhost:456',
							WP_SITEURL: 'localhost:456',
							WP_HOME: 'localhost:777',
						},
					},
				},
			} );
		} );

		it( 'should not append port to URLs when port is null', async () => {
			const processed = await postProcessConfig( {
				port: null,
				testsPort: null,
				config: {
					WP_TESTS_DOMAIN: 'localhost',
					WP_SITEURL: 'http://localhost',
					WP_HOME: 'http://localhost',
				},
				env: {
					development: {},
					tests: {},
				},
			} );

			// Null ports should not be appended to URLs.
			expect( processed.env.development.config.WP_SITEURL ).toEqual(
				'http://localhost'
			);
			expect( processed.env.tests.config.WP_SITEURL ).toEqual(
				'http://localhost'
			);
		} );
	} );

	describe( 'validatePortUniqueness', () => {
		it( 'should fail when two environments have the same port', async () => {
			await expect(
				postProcessConfig( {
					env: {
						development: {
							port: 123,
						},
						tests: {
							port: 123,
						},
					},
				} )
			).rejects.toThrow(
				new ValidationError(
					'The "development" and "tests" environments may not have the same port.'
				)
			);
		} );

		it( 'should skip port validation for disabled tests environment', async () => {
			await expect(
				postProcessConfig( {
					testsEnvironment: false,
					port: 123,
					env: {
						development: {},
						tests: {},
					},
				} )
			).resolves.toBeDefined();
		} );

		it( 'should not fail when both environments have null ports', async () => {
			const processed = await postProcessConfig( {
				port: null,
				testsPort: null,
				env: {
					development: {},
					tests: {},
				},
			} );

			expect( processed.env.development.port ).toEqual( null );
			expect( processed.env.tests.port ).toEqual( null );
		} );
	} );

	describe( 'port resolver routing (autoPortMode + defaultOriginPorts)', () => {
		it( 'threads autoPortMode and defaultOriginPorts to resolveConfigPorts', async () => {
			// Mock the resolver to return distinct fallback ports so the
			// post-processed config does not trip validatePortUniqueness.
			const portResolver = {
				resolve: jest
					.fn()
					.mockResolvedValueOnce( 8890 )
					.mockResolvedValueOnce( 8891 ),
			};

			const processed = await postProcessConfig(
				{
					env: {
						development: {
							port: 8888,
							config: {
								WP_HOME: 'http://localhost',
								WP_SITEURL: 'http://localhost',
							},
						},
						tests: {
							port: 8889,
							config: {
								WP_HOME: 'http://localhost',
								WP_SITEURL: 'http://localhost',
							},
						},
					},
				},
				{
					portResolver,
					autoPortMode: 'defaults-only',
					defaultOriginPorts: new Set( [
						'development.port',
						'tests.port',
					] ),
				}
			);

			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8888,
				'env.development.port',
				false
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8889,
				'env.tests.port',
				false
			);
			// Resolved port flows into the merged env config and into
			// appendPortToWPConfigs's WP_HOME / WP_SITEURL outputs.
			expect( processed.env.development.port ).toEqual( 8890 );
			expect( processed.env.development.config.WP_HOME ).toEqual(
				'http://localhost:8890'
			);
			expect( processed.env.development.config.WP_SITEURL ).toEqual(
				'http://localhost:8890'
			);
			expect( processed.env.tests.port ).toEqual( 8891 );
			expect( processed.env.tests.config.WP_HOME ).toEqual(
				'http://localhost:8891'
			);
		} );

		it( 'with autoPortMode=defaults-only routes user-set port to strict and default-origin port to non-strict', async () => {
			const portResolver = {
				resolve: jest
					.fn()
					.mockImplementation( ( preferred ) =>
						Promise.resolve( preferred )
					),
			};

			await postProcessConfig(
				{
					env: {
						development: { port: 8888 },
						tests: { port: 9001 },
					},
				},
				{
					portResolver,
					autoPortMode: 'defaults-only',
					defaultOriginPorts: new Set( [ 'development.port' ] ),
				}
			);

			// development.port is default-origin → non-strict (false).
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8888,
				'env.development.port',
				false
			);
			// tests.port is user-set → strict (true).
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				9001,
				'env.tests.port',
				true
			);
		} );

		it( 'with autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)', async () => {
			const portResolver = {
				resolve: jest
					.fn()
					.mockImplementation( ( preferred ) =>
						Promise.resolve( preferred )
					),
			};

			await postProcessConfig(
				{
					env: {
						development: {
							port: 8888,
							phpmyadminPort: 8080,
						},
						tests: {
							port: 8889,
						},
					},
				},
				{
					portResolver,
					autoPortMode: 'defaults-only',
					defaultOriginPorts: new Set( [
						'development.port',
						'tests.port',
					] ),
				}
			);

			// Resolver was called for HTTP ports.
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8888,
				'env.development.port',
				false
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8889,
				'env.tests.port',
				false
			);
			// Resolver was NEVER called for phpmyadminPort under
			// defaults-only mode (preserving today's behavior verbatim
			// where phpmyadminPort is only auto-resolved under --auto-port).
			const phpmyadminCalls = portResolver.resolve.mock.calls.filter(
				( call ) => call[ 1 ].includes( 'phpmyadminPort' )
			);
			expect( phpmyadminCalls ).toHaveLength( 0 );
		} );

		it( 'with autoPortMode=all routes both http ports AND phpmyadminPort non-strict (preserves PR #74472 behavior)', async () => {
			const portResolver = {
				resolve: jest
					.fn()
					.mockImplementation( ( preferred ) =>
						Promise.resolve( preferred )
					),
			};

			await postProcessConfig(
				{
					env: {
						development: {
							port: 8888,
							phpmyadminPort: 8080,
						},
						tests: { port: 8889 },
					},
				},
				{
					portResolver,
					autoPortMode: 'all',
					defaultOriginPorts: new Set(),
				}
			);

			// All three ports get the non-strict (false) third argument.
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8888,
				'env.development.port',
				false
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8889,
				'env.tests.port',
				false
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8080,
				'env.development.phpmyadminPort',
				false
			);
		} );

		it( 'defaults to autoPortMode=off and routes ports strict (back-compat for callers that do not pass options)', async () => {
			const portResolver = {
				resolve: jest
					.fn()
					.mockImplementation( ( preferred ) =>
						Promise.resolve( preferred )
					),
			};

			await postProcessConfig(
				{
					env: {
						development: {
							port: 8888,
							phpmyadminPort: 8080,
						},
						tests: { port: 8889 },
					},
				},
				{ portResolver }
			);

			// All ports get strict=true under the default 'off' mode.
			// Note that 'off' does NOT skip phpmyadminPort — only
			// 'defaults-only' does (the skip rule is mode-specific).
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8888,
				'env.development.port',
				true
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8889,
				'env.tests.port',
				true
			);
			expect( portResolver.resolve ).toHaveBeenCalledWith(
				8080,
				'env.development.phpmyadminPort',
				true
			);
		} );
	} );

	describe( 'testsEnvironment', () => {
		it( 'should ignore env overrides entirely when testsEnvironment is false', async () => {
			const processed = await postProcessConfig( {
				testsEnvironment: false,
				port: 123,
				testsPort: 456,
				coreSource: {
					type: 'test',
				},
				config: {
					TESTS_ROOT: 'root',
				},
				pluginSources: [
					{
						type: 'root-plugin',
					},
				],
				env: {
					development: {
						config: {
							TEST_ENV: 'development',
						},
					},
					tests: {},
				},
			} );

			// Development should get root options but NOT env overrides.
			expect( processed.env.development.port ).toEqual( 123 );
			expect( processed.env.development.config.TESTS_ROOT ).toEqual(
				'root'
			);
			expect( processed.env.development.config.TEST_ENV ).toBeUndefined();

			// Tests should not get root options merged.
			expect( processed.env.tests ).toEqual( {} );
		} );
	} );
} );
