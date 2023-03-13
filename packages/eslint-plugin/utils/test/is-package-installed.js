/**
 * Internal dependencies
 */
import isPackageInstalled from '../is-package-installed';

describe( 'isPackageInstalled', () => {
	test( 'returns false when package not installed', () => {
		const result = isPackageInstalled( 'nonexistent-package-name' );

		expect( result ).toBe( false );
	} );

	test( 'returns true when package installed', () => {
		const result = isPackageInstalled( 'eslint' );

		expect( result ).toBe( true );
	} );
} );
