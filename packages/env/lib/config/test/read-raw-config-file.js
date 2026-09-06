import { createRequire } from 'node:module';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const fs = require( 'node:fs' );
const readFile = vi
	.spyOn( fs.promises, 'readFile' )
	.mockImplementation( () => undefined );
const readRawConfigFile = require( '../read-raw-config-file' );
const { ValidationError } = require( '../validate-config' );

afterAll( () => {
	vi.restoreAllMocks();
} );

describe( 'readRawConfigFile', () => {
	beforeEach( () => {
		readFile.mockReset().mockImplementation( () => undefined );
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
