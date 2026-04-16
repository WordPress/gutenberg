'use strict';

/**
 * External dependencies
 */
const { readFile } = require( 'fs' ).promises;
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const loadConfig = require( '../load-config' );
const detectDirectoryType = require( '../detect-directory-type' );
const md5 = require( '../../md5' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		stat: jest.fn().mockResolvedValue( true ),
		mkdir: jest.fn(),
		writeFile: jest.fn(),
	},
	existsSync: jest.fn().mockReturnValue( false ),
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

	describe( 'cache directory naming', () => {
		beforeEach( () => {
			readFile.mockImplementation( async () => {
				throw { code: 'ENOENT' };
			} );
			existsSync.mockReturnValue( false );
		} );

		it( 'uses the descriptive `wp-env-<dir>-<8charHash>` format by default', async () => {
			const config = await loadConfig( '/test/gutenberg' );

			const expectedHash = md5( '/test/gutenberg/.wp-env.json' ).slice(
				0,
				8
			);
			expect( config.workDirectoryPath ).toEqual(
				`/cache/wp-env-gutenberg-${ expectedHash }`
			);
			// The short hash is exactly 8 hex chars.
			expect( expectedHash ).toMatch( /^[0-9a-f]{8}$/ );
		} );

		it( 'produces distinct cache dirs for the same config filename in different directories', async () => {
			const configA = await loadConfig( '/work/alice/myproject' );
			const configB = await loadConfig( '/work/bob/myproject' );

			expect( configA.workDirectoryPath ).toMatch(
				/^\/cache\/wp-env-myproject-[0-9a-f]{8}$/
			);
			expect( configB.workDirectoryPath ).toMatch(
				/^\/cache\/wp-env-myproject-[0-9a-f]{8}$/
			);
			expect( configA.workDirectoryPath ).not.toEqual(
				configB.workDirectoryPath
			);
		} );

		it( 'extracts a variant from `.wp-env.<variant>.json` custom config', async () => {
			const config = await loadConfig(
				'/test/gutenberg',
				'/test/gutenberg/.wp-env.test.json'
			);

			const expectedHash = md5(
				'/test/gutenberg/.wp-env.test.json'
			).slice( 0, 8 );
			expect( config.workDirectoryPath ).toEqual(
				`/cache/wp-env-gutenberg-test-${ expectedHash }`
			);
		} );

		it( 'derives a variant from an arbitrarily-named custom config file', async () => {
			const config = await loadConfig(
				'/test/gutenberg',
				'/some/configs/staging.json'
			);

			const expectedHash = md5( '/some/configs/staging.json' ).slice(
				0,
				8
			);
			// The project-dir segment comes from the config file's parent directory
			expect( config.workDirectoryPath ).toEqual(
				`/cache/wp-env-configs-staging-${ expectedHash }`
			);
		} );

		it( 'keeps using the legacy pure-md5 cache directory when it already exists', async () => {
			const configFilePath = '/test/gutenberg/.wp-env.json';
			const legacyPath = `/cache/${ md5( configFilePath ) }`;

			// the legacy md5 directory is present on disk.
			existsSync.mockImplementation(
				( candidate ) => candidate === legacyPath
			);

			const config = await loadConfig( '/test/gutenberg' );

			expect( config.workDirectoryPath ).toEqual( legacyPath );
		} );
	} );
} );
