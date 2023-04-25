/**
 * Internal dependencies
 */
import { normalizeTextString } from '../strings';

describe( 'normalizeTextString', () => {
	it( 'should normalize hyphen-like characters to hyphens', () => {
		expect( normalizeTextString( 'foo~bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo־bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo‐bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo⸻bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo゠bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo－bar' ) ).toBe( 'foo-bar' );
	} );
} );
