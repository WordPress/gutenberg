/**
 * Internal dependencies
 */
import { normalizeRowColSpan } from '../utils';

describe( 'normalizeRowColSpan', () => {
	it( 'should convert a value to a string', () => {
		expect( normalizeRowColSpan( 2 ) ).toBe( '2' );
		expect( normalizeRowColSpan( '2' ) ).toBe( '2' );
		expect( normalizeRowColSpan( 2.55 ) ).toBe( '2' );
		expect( normalizeRowColSpan( '2.55' ) ).toBe( '2' );
	} );

	it( 'should return undefined for values not allowed as the rowspan/colspan attributes', () => {
		expect( normalizeRowColSpan( -2 ) ).toBe( undefined );
		expect( normalizeRowColSpan( '-2' ) ).toBe( undefined );
		expect( normalizeRowColSpan( 1 ) ).toBe( undefined );
		expect( normalizeRowColSpan( '1' ) ).toBe( undefined );
	} );
} );
