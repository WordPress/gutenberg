/**
 * Internal dependencies
 */
import { getPackageInfo } from '../package-utils.mjs';

describe( 'getPackageInfo() resolve-miss contract', () => {
	it( 'returns null (does not throw) for an unresolvable scoped package', () => {
		expect( () =>
			getPackageInfo( '@does-not-exist/nope', __dirname )
		).not.toThrow();

		expect(
			getPackageInfo( '@does-not-exist/nope', __dirname )
		).toBeNull();
	} );

	it( 'returns the cached null on a repeated miss', () => {
		const first = getPackageInfo( '@still-missing/pkg', __dirname );
		const second = getPackageInfo( '@still-missing/pkg', __dirname );

		expect( first ).toBeNull();
		expect( second ).toBeNull();
	} );

	it( 'still resolves an installed package that exposes its package.json', () => {
		const info = getPackageInfo( '@wordpress/build', __dirname );

		expect( info ).toMatchObject( { name: '@wordpress/build' } );
	} );
} );
