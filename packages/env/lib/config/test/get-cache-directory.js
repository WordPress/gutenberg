import { createRequire } from 'node:module';
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
const require = createRequire( import.meta.url );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const stat = vi
	.spyOn( fs.promises, 'stat' )
	.mockImplementation( () => undefined );
const homedir = vi.spyOn( os, 'homedir' ).mockImplementation( () => undefined );
const getCacheDirectory = require( '../get-cache-directory' );

afterAll( () => {
	vi.restoreAllMocks();
} );

describe( 'getCacheDirectory', () => {
	beforeEach( () => {
		stat.mockReset().mockImplementation( () => undefined );
		homedir.mockReset().mockImplementation( () => undefined );
	} );

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
