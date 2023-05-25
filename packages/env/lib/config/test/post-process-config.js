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

	it( 'should merge relevant root options into environment options', () => {
		const processed = postProcessConfig( {
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

	it( 'should not merge some root options into environment options', () => {
		const processed = postProcessConfig( {
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
		it( 'should add port to certain environment config options', () => {
			const processed = postProcessConfig( {
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

		it( 'should not overwrite port in WP_HOME', () => {
			const processed = postProcessConfig( {
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
	} );

	describe( 'validatePortUniqueness', () => {
		it( 'should fail when two environments have the same port', () => {
			expect( () => {
				postProcessConfig( {
					env: {
						development: {
							port: 123,
						},
						tests: {
							port: 123,
						},
					},
				} );
			} ).toThrow(
				new ValidationError(
					'The "development" and "tests" environments may not have the same port.'
				)
			);
		} );
	} );
} );
