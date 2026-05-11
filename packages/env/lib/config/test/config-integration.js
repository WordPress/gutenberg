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
const { findAvailablePort, isPortAvailable } = require( '../../port-utils' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		stat: jest.fn().mockResolvedValue( true ),
		mkdir: jest.fn(),
		writeFile: jest.fn(),
	},
	existsSync: jest.fn().mockReturnValue( false ),
} ) );

jest.mock( '../../port-utils' );

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
	// Save the inherited CI value so we can restore it after each test
	// (the new tests below stomp on `process.env.CI` to assert the guard).
	let originalCI;

	beforeEach( () => {
		process.env.WP_ENV_HOME = '/cache';
		detectDirectoryType.mockResolvedValue( null );
		originalCI = process.env.CI;
		// Force-disable CI for tests that exercise the auto-fallback paths.
		// Tests that need CI on opt back in explicitly.
		delete process.env.CI;
	} );

	afterEach( () => {
		delete process.env.WP_ENV_HOME;
		delete process.env.WP_ENV_PORT;
		delete process.env.WP_ENV_MYSQL_PORT;
		delete process.env.WP_ENV_TESTS_PORT;
		delete process.env.WP_ENV_TESTS_MYSQL_PORT;
		delete process.env.WP_ENV_LIFECYCLE_SCRIPT_AFTER_START;
		// Restore the inherited CI value, if any.
		if ( originalCI === undefined ) {
			delete process.env.CI;
		} else {
			process.env.CI = originalCI;
		}
		jest.clearAllMocks();
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

	describe( 'auto-port fallback (tri-state autoPort)', () => {
		const stubSpinner = () => ( {
			text: '',
			info: jest.fn(),
			start: jest.fn(),
			fail: jest.fn(),
			warn: jest.fn(),
			stop: jest.fn(),
		} );

		it( 'with no user autoPort and busy default port falls back via defaults-only mode (AC1)', async () => {
			readFile.mockImplementation( async () => {
				throw { code: 'ENOENT' };
			} );

			// Default port 8888 is busy; the resolver should hand back 8890.
			findAvailablePort.mockImplementation( ( { preferredPort } ) => {
				if ( preferredPort === 8888 ) {
					return Promise.resolve( 8890 );
				}
				return Promise.resolve( preferredPort );
			} );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				spinner: stubSpinner(),
			} );

			expect( config.env.development.port ).toEqual( 8890 );
			expect( config.env.development.config.WP_HOME ).toEqual(
				'http://localhost:8890'
			);
			expect( config.env.development.config.WP_SITEURL ).toEqual(
				'http://localhost:8890'
			);
		} );

		it( 'with autoPort:false in user config skips fallback even on default ports (AC5)', async () => {
			readFile.mockImplementation( async ( fileName ) => {
				if ( fileName === '/test/gutenberg/.wp-env.json' ) {
					return JSON.stringify( { autoPort: false } );
				}
				throw { code: 'ENOENT' };
			} );

			findAvailablePort.mockResolvedValue( 8890 );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				spinner: stubSpinner(),
			} );

			// autoPort:false forces 'off' mode, so the auto-fallback path
			// (`findAvailablePort`) is never called. The default port stays
			// as configured; any port-busy error surfaces later at the
			// Docker bind layer with the existing message.
			expect( findAvailablePort ).not.toHaveBeenCalled();
			expect( config.env.development.port ).toEqual( 8888 );
		} );

		it( 'with CI=1 disables fallback regardless of autoPort:true in user config (AC6 + AC8 regression detector)', async () => {
			process.env.CI = '1';

			readFile.mockImplementation( async ( fileName ) => {
				if ( fileName === '/test/gutenberg/.wp-env.json' ) {
					return JSON.stringify( { autoPort: true } );
				}
				throw { code: 'ENOENT' };
			} );

			// Mock both port-utils functions so we can detect which path
			// (if any) was taken. Strict path uses isPortAvailable;
			// auto-fallback path uses findAvailablePort.
			findAvailablePort.mockResolvedValue( 8890 );
			isPortAvailable.mockResolvedValue( true );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				spinner: stubSpinner(),
			} );

			// AC8 regression detector: even with autoPort:true the CI guard
			// forces 'off' mode, so the resolver is not created at all and
			// the auto-fallback path (`findAvailablePort`) is never called.
			// Removing the `if ( process.env.CI )` guard in load-config.js
			// would call findAvailablePort and fail this expectation.
			expect( findAvailablePort ).not.toHaveBeenCalled();
			// Default port stays as configured because no resolver fired.
			expect( config.env.development.port ).toEqual( 8888 );
		} );

		it( 'with CI=1 disables fallback even when autoPort is unset (AC6)', async () => {
			process.env.CI = '1';

			readFile.mockImplementation( async () => {
				throw { code: 'ENOENT' };
			} );

			findAvailablePort.mockResolvedValue( 8890 );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				spinner: stubSpinner(),
			} );

			// CI guard short-circuits the new defaults-only mode.
			expect( findAvailablePort ).not.toHaveBeenCalled();
			expect( config.env.development.port ).toEqual( 8888 );
		} );

		it( 'with CLI autoPort=true and user config autoPort=false has CLI win (AC4 precedence)', async () => {
			readFile.mockImplementation( async ( fileName ) => {
				if ( fileName === '/test/gutenberg/.wp-env.json' ) {
					return JSON.stringify( { autoPort: false } );
				}
				throw { code: 'ENOENT' };
			} );

			findAvailablePort.mockImplementation( ( { preferredPort } ) => {
				if ( preferredPort === 8888 ) {
					return Promise.resolve( 8890 );
				}
				return Promise.resolve( preferredPort );
			} );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				autoPort: true,
				spinner: stubSpinner(),
			} );

			// CLI true wins over config false → fallback fired.
			expect( config.env.development.port ).toEqual( 8890 );
		} );

		it( 'with CLI autoPort=true and explicit user port falls back when port is busy (AC4 behavior-level)', async () => {
			readFile.mockImplementation( async ( fileName ) => {
				if ( fileName === '/test/gutenberg/.wp-env.json' ) {
					return JSON.stringify( { port: 9000 } );
				}
				throw { code: 'ENOENT' };
			} );

			findAvailablePort.mockImplementation( ( { preferredPort } ) => {
				if ( preferredPort === 9000 ) {
					return Promise.resolve( 9001 );
				}
				return Promise.resolve( preferredPort );
			} );

			const config = await loadConfig( '/test/gutenberg', null, {
				resolvePorts: true,
				autoPort: true,
				spinner: stubSpinner(),
			} );

			expect( config.env.development.port ).toEqual( 9001 );
			expect( config.env.development.config.WP_HOME ).toEqual(
				'http://localhost:9001'
			);
		} );
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
