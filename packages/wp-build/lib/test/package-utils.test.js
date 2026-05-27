/**
 * Internal dependencies
 */
import { getPackageInfo } from '../package-utils.mjs';

describe( 'getPackageInfo', () => {
	it( 'returns null instead of throwing when the package is not installed', () => {
		expect( () =>
			getPackageInfo( '@does-not-exist/nope', __dirname )
		).not.toThrow();
		expect( getPackageInfo( '@does-not-exist/nope', __dirname ) ).toBeNull();
	} );

	it( 'returns the cached null on repeated misses without re-throwing', () => {
		// Use a distinct name so this assertion is independent of the test above.
		const first = getPackageInfo( '@still-missing/pkg', __dirname );
		const second = getPackageInfo( '@still-missing/pkg', __dirname );

		expect( first ).toBeNull();
		expect( second ).toBeNull();
	} );

	it( 'resolves an installed package to its package.json object', () => {
		const info = getPackageInfo( 'esbuild', __dirname );

		expect( info ).not.toBeNull();
		expect( info.name ).toBe( 'esbuild' );
	} );
} );
