/**
 * Internal dependencies
 */
import { getNextMajorVersion, getPreviousMajorVersion } from '../version';

describe( 'getNextMajorVersion', () => {
	it( 'increments the minor number by default', () => {
		const result = getNextMajorVersion( '7.3.4-rc.1' );

		expect( result ).toBe( '7.4.0' );
	} );

	it( 'follow the WordPress versioning scheme', () => {
		const result = getNextMajorVersion( '7.9.0' );

		expect( result ).toBe( '8.0.0' );
	} );
} );

describe( 'getPreviousMajorVersion', () => {
	it( 'decrements the minor number by default', () => {
		const result = getPreviousMajorVersion( '7.4.0' );

		expect( result ).toBe( '7.3.0' );
	} );

	it( 'follows the WordPress versioning scheme', () => {
		const result = getPreviousMajorVersion( '8.0.0' );

		expect( result ).toBe( '7.9.0' );
	} );
} );
