'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const { readFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const loadConfig = require( '../load-config' );
const detectDirectoryType = require( '../detect-directory-type' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		stat: jest.fn().mockResolvedValue( true ),
		mkdir: jest.fn(),
		writeFile: jest.fn(),
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

jest.mock( '../detect-directory-type', () => jest.fn() );

describe( 'Config Integration', () => {
	beforeEach( () => {
		process.env.WP_ENV_HOME = '/cache';
		detectDirectoryType.mockResolvedValue( null );
	} );

	afterEach( () => {
		delete process.env.WP_ENV_HOME;
		delete process.env.WP_ENV_PORT;
		delete process.env.WP_ENV_MYSQL_PORT;
		delete process.env.WP_ENV_TESTS_PORT;
		delete process.env.WP_ENV_TESTS_MYSQL_PORT;
		delete process.env.WP_ENV_LIFECYCLE_SCRIPT_AFTER_START;
	} );

	it( 'should use default configuration', async () => {
		readFile.mockImplementation( async () => {
			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config.env.development.port ).toEqual( 8888 );
		expect( config.env.tests.port ).toEqual( 8889 );
		expect( config.env.development.mysqlPort ).toEqual( null );
		expect( config.env.tests.mysqlPort ).toEqual( null );
		expect( config ).toMatchSnapshot();
	} );

	it( 'should load local configuration file', async () => {
		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
					lifecycleScripts: {
						afterStart: 'test',
						afterClean: null,
						afterDestroy: null,
					},
					env: {
						development: {
							mysqlPort: 13306,
						},
						tests: {
							mysqlPort: 23307,
						},
					},
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config.env.development.port ).toEqual( 123 );
		expect( config.env.tests.port ).toEqual( 8889 );
		expect( config.env.development.mysqlPort ).toEqual( 13306 );
		expect( config.env.tests.mysqlPort ).toEqual( 23307 );
		expect( config ).toMatchSnapshot();
	} );

	it( 'should load local and override configuration files', async () => {
		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
					testsPort: 456,
					lifecycleScripts: {
						afterStart: 'test',
						afterClean: null,
						afterDestroy: null,
					},
					env: {
						tests: {
							mysqlPort: 13306,
						},
					},
				} );
			}

			if ( fileName === '/test/gutenberg/.wp-env.override.json' ) {
				return JSON.stringify( {
					port: 999,
					lifecycleScripts: {
						afterStart: null,
						afterClean: null,
						afterDestroy: 'test',
					},
					env: {
						development: {
							mysqlPort: 23306,
						},
						tests: {
							mysqlPort: 23307,
						},
					},
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config.env.development.port ).toEqual( 999 );
		expect( config.env.tests.port ).toEqual( 456 );
		expect( config.env.development.mysqlPort ).toEqual( 23306 );
		expect( config.env.tests.mysqlPort ).toEqual( 23307 );
		expect( config ).toMatchSnapshot();
	} );

	it( 'should use environment variables over local and override configuration files', async () => {
		process.env.WP_ENV_PORT = 12345;
		process.env.WP_ENV_MYSQL_PORT = 23306;
		process.env.WP_ENV_TESTS_PORT = 61234;
		process.env.WP_ENV_TESTS_MYSQL_PORT = 23307;
		process.env.WP_ENV_LIFECYCLE_SCRIPT_AFTER_START = 'test';

		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
					testsPort: 456,
					lifecycleScripts: {
						afterStart: 'local',
						afterClean: null,
						afterDestroy: null,
					},
					env: {
						tests: {
							mysqlPort: 13306,
						},
					},
				} );
			}

			if ( fileName === '/test/gutenberg/.wp-env.override.json' ) {
				return JSON.stringify( {
					port: 999,
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config.env.development.port ).toEqual( 12345 );
		expect( config.env.tests.port ).toEqual( 61234 );
		expect( config.env.development.mysqlPort ).toEqual( 23306 );
		expect( config.env.tests.mysqlPort ).toEqual( 23307 );
		expect( config.lifecycleScripts ).toHaveProperty(
			'afterStart',
			'test'
		);
		expect( config ).toMatchSnapshot();
	} );
} );
/* eslint-enable jest/no-conditional-expect */
