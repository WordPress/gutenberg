/**
 * Internal dependencies
 */
import { rgba } from '../colors';

describe( 'rbga', () => {
	it( 'should output the expected string', () => {
		expect( rgba( '#000000', 0.5 ) ).toBe( 'rgba(0, 0, 0, 0.5)' );
		expect( rgba( '#f00', 0.2 ) ).toBe( 'rgba(255, 0, 0, 0.2)' );
	} );
} );
