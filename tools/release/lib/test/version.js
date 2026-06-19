/**
 * Internal dependencies
 */
import { getNextMajorVersion } from '../version';

describe( 'getNextMajorVersion', () => {
	it( 'increases the minor number by default', () => {
		const result = getNextMajorVersion( '7.3.4-rc.1' );

		expect( result ).toBe( '7.4.0' );
	} );

	it( 'follow the WordPress versioning scheme', () => {
		const result = getNextMajorVersion( '7.9.0' );

		expect( result ).toBe( '8.0.0' );
	} );
} );
