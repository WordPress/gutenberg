'use strict';
/**
 * Internal dependencies
 */
const parseConfig = require( '../parse-config' );
const readRawConfigFile = require( '../read-raw-config-file' );

jest.mock( 'fs', () => ( {
	promises: {
		stat: jest.fn().mockReturnValue( Promise.resolve( false ) ),
	},
} ) );

// This mocks a small response with a format matching the stable-check API.
// It makes getLatestWordPressVersion resolve to "100.0.0".
jest.mock( 'got', () =>
	jest.fn( ( url ) => ( {
		json: () => {
			if ( url === 'https://api.wordpress.org/core/stable-check/1.0/' ) {
				return Promise.resolve( {
					'1.0': 'insecure',
					'99.1.1': 'outdated',
					'100.0.0': 'latest',
					'100.0.1': 'fancy',
				} );
			}
		},
	} ) )
);

jest.mock( '../read-raw-config-file', () => jest.fn().mockReturnValue( null ) );
jest.mock( '../detect-directory-type', () =>
	jest.fn().mockReturnValue( Promise.resolve( null ) )
);

/**
 * Since our configurations are merged, we will want to refer to the parsed default config frequently.
 */
const DEFAULT_CONFIG = {
	port: 8888,
	phpVersion: null,
	coreSource: {
		type: 'git',
		url: 'https://github.com/WordPress/WordPress.git',
		ref: '100.0.0',
		path: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
		clonePath: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
		basename: 'WordPress',
		testsPath: '/test/0afa32312977c8e3510775b85c20017d/tests-WordPress',
	},
	pluginSources: [],
	themeSources: [],
	config: {
		WP_DEBUG: true,
		SCRIPT_DEBUG: true,
		WP_ENVIRONMENT_TYPE: 'local',
		WP_PHP_BINARY: 'php',
		WP_TESTS_EMAIL: 'admin@example.org',
		WP_TESTS_TITLE: 'Test Blog',
		WP_TESTS_DOMAIN: 'localhost',
		WP_SITEURL: 'http://localhost',
		WP_HOME: 'http://localhost',
	},
	mappings: {},
	env: {
		development: {},
		tests: {
			port: 8889,
			config: {
				WP_DEBUG: false,
				SCRIPT_DEBUG: false,
			},
		},
	},
};

describe( 'parseConfig', () => {
	beforeAll( () => {
		process.env.WP_ENV_HOME = '/test';
	} );

	afterAll( () => {
		delete process.env.WP_ENV_HOME;
	} );

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return default config', async () => {
		const parsed = await parseConfig( './' );

		expect( parsed ).toEqual( DEFAULT_CONFIG );
	} );

	it( 'should merge configs with precedence', async () => {
		readRawConfigFile.mockImplementation( async ( configFile ) => {
			if ( configFile === './.wp-env.json' ) {
				return {
					core: 'WordPress/WordPress#Test',
					phpVersion: '1.0',
					env: {
						development: {
							port: 1234,
						},
						tests: {
							port: 5678,
						},
					},
				};
			}

			if ( configFile === './.wp-env.override.json' ) {
				return {
					phpVersion: '2.0',
					env: {
						tests: {
							port: 1011,
						},
					},
				};
			}

			throw new Error( 'Invalid File: ' + configFile );
		} );

		const parsed = await parseConfig( './' );

		const expected = {
			...DEFAULT_CONFIG,
			coreSource: {
				basename: 'WordPress',
				path: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
				clonePath: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
				ref: 'Test',
				testsPath:
					'/test/0afa32312977c8e3510775b85c20017d/tests-WordPress',
				url: 'https://github.com/WordPress/WordPress.git',
				type: 'git',
			},
			phpVersion: '2.0',
		};
		expected.env.development.port = 1234;
		expected.env.tests.port = 1011;
		expect( parsed ).toEqual( expected );
	} );

	it( 'should override with environment variables', async () => {
		process.env.WP_ENV_PORT = 123;
		process.env.WP_ENV_TESTS_PORT = 456;
		process.env.WP_ENV_CORE = 'WordPress/WordPress#test';
		process.env.WP_ENV_PHP_VERSION = '3.0';

		const parsed = await parseConfig( './' );

		expect( parsed ).toEqual( {
			...DEFAULT_CONFIG,
			port: 123,
			testsPort: 456,
			coreSource: {
				basename: 'WordPress',
				path: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
				clonePath: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
				ref: 'test',
				testsPath:
					'/test/0afa32312977c8e3510775b85c20017d/tests-WordPress',
				url: 'https://github.com/WordPress/WordPress.git',
				type: 'git',
			},
			phpVersion: '3.0',
			env: {
				development: {
					port: 123,
					phpVersion: '3.0',
					coreSource: {
						basename: 'WordPress',
						path: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
						clonePath:
							'/test/0afa32312977c8e3510775b85c20017d/WordPress',
						ref: 'test',
						testsPath:
							'/test/0afa32312977c8e3510775b85c20017d/tests-WordPress',
						url: 'https://github.com/WordPress/WordPress.git',
						type: 'git',
					},
				},
				tests: {
					port: 456,
					phpVersion: '3.0',
					coreSource: {
						basename: 'WordPress',
						path: '/test/0afa32312977c8e3510775b85c20017d/WordPress',
						clonePath:
							'/test/0afa32312977c8e3510775b85c20017d/WordPress',
						ref: 'test',
						testsPath:
							'/test/0afa32312977c8e3510775b85c20017d/tests-WordPress',
						url: 'https://github.com/WordPress/WordPress.git',
						type: 'git',
					},
					config: {
						WP_DEBUG: false,
						SCRIPT_DEBUG: false,
					},
				},
			},
		} );
	} );
} );
