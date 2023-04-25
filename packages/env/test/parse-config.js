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
const { loadConfig } = require( '../lib/config' );
const detectDirectoryType = require( '../lib/config/detect-directory-type' );

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

jest.mock( '../lib/config/detect-directory-type', () => jest.fn() );

describe( 'Config Parsing', () => {
	beforeEach( () => {
		process.env.WP_ENV_HOME = '/cache';
		detectDirectoryType.mockResolvedValue( null );
	} );

	afterEach( () => {
		delete process.env.WP_ENV_HOME;
	} );

	it( 'should use default configuration', async () => {
		readFile.mockImplementation( async () => {
			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( '/test/gutenberg' );

		expect( config ).toMatchSnapshot();
	} );

	it( 'should load local configuration', async () => {
		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
				} );
			}

			throw { code: 'ENOENT' };
		} );

		const config = await loadConfig( path.resolve( '.' ) );

		expect( config ).toMatchSnapshot();
	} );

	it( 'should load local and override configurations', async () => {
		readFile.mockImplementation( async ( fileName ) => {
			if ( fileName === '/test/gutenberg/.wp-env.json' ) {
				return JSON.stringify( {
					core: 'WordPress/WordPress#trunk',
					port: 123,
					testsPort: 456,
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

		expect( config ).toMatchSnapshot();
	} );
} );
/* eslint-enable jest/no-conditional-expect */
