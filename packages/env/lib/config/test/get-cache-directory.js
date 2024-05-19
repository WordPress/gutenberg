'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const { stat } = require( 'fs' ).promises;
const { homedir } = require( 'os' );

/**
 * Internal dependencies
 */
const getCacheDirectory = require( '../get-cache-directory' );
const readRawConfigFile = require( '../read-raw-config-file' );

jest.mock( 'fs', () => ( {
	promises: {
		stat: jest.fn(),
	},
} ) );
jest.mock( 'os', () => ( {
	homedir: jest.fn(),
} ) );

jest.mock( '../read-raw-config-file', () => jest.fn() );

describe( 'getCacheDirectory', () => {
	afterEach( () => {
		delete process.env.WP_ENV_HOME;
	} );

	it( 'uses WP_ENV_HOME for cache directory when set', async () => {
		process.env.WP_ENV_HOME = '/test';

		const parsed = await getCacheDirectory();

		expect( homedir ).not.toHaveBeenCalled();
		expect( parsed ).toEqual( '/test' );
	} );

	it( 'uses hidden home directory for cache', async () => {
		stat.mockRejectedValue( false );
		homedir.mockReturnValue( '/home/test' );

		const parsed = await getCacheDirectory();

		expect( homedir ).toHaveBeenCalled();
		expect( parsed ).toEqual( '/home/test/.wp-env' );
	} );

	it( 'uses non-hidden cache directory when using Snap-installed Docker', async () => {
		stat.mockResolvedValue( true );
		homedir.mockReturnValue( '/home/test' );

		const parsed = await getCacheDirectory();

		expect( homedir ).toHaveBeenCalled();
		expect( parsed ).toEqual( '/home/test/wp-env' );
	} );

	it( 'uses WP_ENV_HOME for cache directory when set in .wp-env.json file', async () => {
		readRawConfigFile.mockImplementation( async ( configFile ) => {
			if ( configFile === '/test/gutenberg/.wp-env.json' ) {
				return {
					core: 'WordPress/WordPress#Test',
					phpVersion: '1.0',
					lifecycleScripts: {
						afterStart: 'test',
					},
					env: {
						development: {
							port: 1234,
						},
						tests: {
							port: 5678,
						},
					},
					config: {
						WP_ENV_HOME: '/test/gutenberg/',
					},
				};
			}

			throw new Error( 'Invalid File: ' + configFile );
		} );

		const parsed = await getCacheDirectory(
			'/test/gutenberg/.wp-env.json'
		);

		expect( parsed ).toEqual( '/test/gutenberg' );
	} );

	it( 'uses WP_ENV_HOME for cache directory when set in .wp-env-override.json file', async () => {
		readRawConfigFile.mockImplementation( async ( configFile ) => {
			if ( configFile === '/test/gutenberg/.wp-env-override.json' ) {
				return {
					core: 'WordPress/WordPress#Test',
					phpVersion: '1.0',
					lifecycleScripts: {
						afterStart: 'test',
					},
					env: {
						development: {
							port: 1234,
						},
						tests: {
							port: 5678,
						},
					},
					config: {
						WP_ENV_HOME: '/test/gutenberg/',
					},
				};
			}

			throw new Error( 'Invalid File: ' + configFile );
		} );

		const parsed = await getCacheDirectory(
			'/test/gutenberg/.wp-env-override.json'
		);

		expect( parsed ).toEqual( '/test/gutenberg' );
	} );
} );
/* eslint-enable jest/no-conditional-expect */
