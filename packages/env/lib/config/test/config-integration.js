'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const path = require( 'path' );
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
		delete process.env.WP_ENV_TESTS_PORT;
		delete process.env.WP_ENV_LIFECYCLE_SCRIPT_AFTER_START;
	} );

	it( 'should use default configuration', async () => {
		readFile.mockImplementation( async () => {
			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config.env.development.port ).toEqual( 8888 );
		expect( config.env.tests.port ).toEqual( 8889 );
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
					},
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( path.resolve( '/test/gutenberg' ) );

		expect( config.env.development.port ).toEqual( 123 );
		expect( config.env.tests.port ).toEqual( 8889 );
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
					},
				} );
			}

			if ( fileName === '/test/gutenberg/.wp-env.override.json' ) {
				return JSON.stringify( {
					port: 999,
					lifecycleScripts: {
						afterStart: null,
						afterEnd: 'test',
					},
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( path.resolve( '/test/gutenberg' ) );

		expect( config.env.development.port ).toEqual( 999 );
		expect( config.env.tests.port ).toEqual( 456 );
		expect( config ).toMatchSnapshot();
	} );

	it( 'should use environment variables over local and override configuration files', async () => {
		process.env.WP_ENV_PORT = 12345;
		process.env.WP_ENV_TESTS_PORT = 61234;
		process.env.WP_ENV_LIFECYCLE_SCRIPT_AFTER_START = 'test';

		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
					testsPort: 456,
					lifecycleEvents: {
						afterStart: 'local',
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

		const config = await loadConfig( path.resolve( '/test/gutenberg' ) );

		expect( config.env.development.port ).toEqual( 12345 );
		expect( config.env.tests.port ).toEqual( 61234 );
		expect( config.lifecycleScripts ).toHaveProperty(
			'afterStart',
			'test'
		);
		expect( config ).toMatchSnapshot();
	} );
} );
/* eslint-enable jest/no-conditional-expect */
