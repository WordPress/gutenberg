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

jest.mock( 'fs', () => ( {
	promises: {
		stat: jest.fn(),
	},
} ) );
jest.mock( 'os', () => ( {
	homedir: jest.fn(),
} ) );

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
} );
/* eslint-enable jest/no-conditional-expect */
