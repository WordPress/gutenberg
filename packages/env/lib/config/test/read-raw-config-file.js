'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * External dependencies
 */
const { readFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const readRawConfigFile = require( '../read-raw-config-file' );
const { ValidationError } = require( '../validate-config' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
	},
} ) );

describe( 'readRawConfigFile', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns null if it cannot find a file', async () => {
		readFile.mockRejectedValue( { code: 'ENOENT' } );

		const result = await readRawConfigFile( '/.wp-env.json' );
		expect( result ).toBe( null );
	} );

	it( 'rejects when read file fails', async () => {
		readFile.mockRejectedValue( { message: 'Test' } );

		expect.assertions( 1 );

		try {
			await readRawConfigFile( '/.wp-env.json' );
		} catch ( error ) {
			expect( error ).toEqual(
				new ValidationError( 'Could not read .wp-env.json: Test' )
			);
		}
	} );
} );
/* eslint-enable jest/no-conditional-expect */
