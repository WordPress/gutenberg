import { describe, expect, it } from 'vitest';
import { getFontStretchRange } from '../get-font-stretch-range';
import { parseFontStretchValue } from '../parse-font-stretch';

describe( 'parseFontStretchValue', () => {
	it( 'reads the keywords the property names', () => {
		expect( parseFontStretchValue( 'condensed' ) ).toBe( 75 );
		expect( parseFontStretchValue( 'normal' ) ).toBe( 100 );
		expect( parseFontStretchValue( 'semi-expanded' ) ).toBe( 112.5 );
		expect( parseFontStretchValue( ' Ultra-Expanded ' ) ).toBe( 200 );
	} );

	it( 'reads a percentage', () => {
		expect( parseFontStretchValue( '75%' ) ).toBe( 75 );
		expect( parseFontStretchValue( '112.5%' ) ).toBe( 112.5 );
		expect( parseFontStretchValue( '151%' ) ).toBe( 151 );
	} );

	it( 'refuses what the property does not take', () => {
		// A bare number is not a width; the percentage sign is required.
		expect( parseFontStretchValue( '75' ) ).toBeUndefined();
		expect( parseFontStretchValue( '-10%' ) ).toBeUndefined();
		expect( parseFontStretchValue( 'wide' ) ).toBeUndefined();
	} );
} );

describe( 'getFontStretchRange', () => {
	it( 'returns undefined for static faces', () => {
		expect(
			getFontStretchRange( [
				{ fontStretch: 'condensed' },
				{ fontStretch: '100%' },
			] )
		).toBeUndefined();
		expect( getFontStretchRange( undefined ) ).toBeUndefined();
		expect(
			getFontStretchRange( [ { fontWeight: '100 900' } ] )
		).toBeUndefined();
	} );

	it( 'reads a range of percentages', () => {
		expect(
			getFontStretchRange( [ { fontStretch: '25% 151%' } ] )
		).toEqual( { min: 25, max: 151 } );
	} );

	it( 'reads a range named with keywords', () => {
		// The descriptor takes the same keywords the property does.
		expect(
			getFontStretchRange( [ { fontStretch: 'condensed expanded' } ] )
		).toEqual( { min: 75, max: 125 } );
	} );

	it( 'orders a reversed range and spans several faces', () => {
		expect(
			getFontStretchRange( [
				{ fontStretch: '151% 25%' },
				{ fontStretch: '10% 60%' },
			] )
		).toEqual( { min: 10, max: 151 } );
	} );

	it( 'skips a range the descriptor cannot express', () => {
		expect(
			getFontStretchRange( [ { fontStretch: 'narrow wide' } ] )
		).toBeUndefined();
	} );
} );
