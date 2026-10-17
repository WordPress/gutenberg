import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getPackageInfo } from '../package-utils.mjs';

const testDirectory = path.dirname( fileURLToPath( import.meta.url ) );

describe( 'getPackageInfo() resolve-miss contract', () => {
	it( 'returns null (does not throw) for an unresolvable scoped package', () => {
		expect( () =>
			getPackageInfo( '@does-not-exist/nope', testDirectory )
		).not.toThrow();

		expect(
			getPackageInfo( '@does-not-exist/nope', testDirectory )
		).toBeNull();
	} );

	it( 'returns the cached null on a repeated miss', () => {
		const first = getPackageInfo( '@still-missing/pkg', testDirectory );
		const second = getPackageInfo( '@still-missing/pkg', testDirectory );

		expect( first ).toBeNull();
		expect( second ).toBeNull();
	} );

	it( 'still resolves an installed package that exposes its package.json', () => {
		const info = getPackageInfo( '@wordpress/build', testDirectory );

		expect( info ).toMatchObject( { name: '@wordpress/build' } );
	} );
} );
