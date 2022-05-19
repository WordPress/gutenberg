/**
 * Internal dependencies
 */
import { getOptimalTextColor, getOptimalTextShade } from '../colors';

describe( 'getOptimalTextColor', () => {
	test( 'should be white for dark backgrounds', () => {
		expect( getOptimalTextColor( 'black' ) ).toBe( '#ffffff' );
		expect( getOptimalTextColor( '#000' ) ).toBe( '#ffffff' );
		expect( getOptimalTextColor( '#111' ) ).toBe( '#ffffff' );
		expect( getOptimalTextColor( '#123' ) ).toBe( '#ffffff' );
		expect( getOptimalTextColor( '#555' ) ).toBe( '#ffffff' );
		expect( getOptimalTextColor( '#05f' ) ).toBe( '#ffffff' );
	} );

	test( 'should be black for light backgrounds', () => {
		expect( getOptimalTextColor( 'white' ) ).toBe( '#000000' );
		expect( getOptimalTextColor( '#fff' ) ).toBe( '#000000' );
		expect( getOptimalTextColor( '#def' ) ).toBe( '#000000' );
		expect( getOptimalTextColor( '#c3c3c3' ) ).toBe( '#000000' );
		expect( getOptimalTextColor( '#0ff' ) ).toBe( '#000000' );
	} );
} );

describe( 'getOptimalTextShade', () => {
	test( 'should be "light" for dark backgrounds', () => {
		expect( getOptimalTextShade( 'black' ) ).toBe( 'light' );
		expect( getOptimalTextShade( '#000' ) ).toBe( 'light' );
		expect( getOptimalTextShade( '#111' ) ).toBe( 'light' );
		expect( getOptimalTextShade( '#123' ) ).toBe( 'light' );
		expect( getOptimalTextShade( '#555' ) ).toBe( 'light' );
		expect( getOptimalTextShade( '#05f' ) ).toBe( 'light' );
	} );

	test( 'should be "dark" for light backgrounds', () => {
		expect( getOptimalTextShade( 'white' ) ).toBe( 'dark' );
		expect( getOptimalTextShade( '#fff' ) ).toBe( 'dark' );
		expect( getOptimalTextShade( '#def' ) ).toBe( 'dark' );
		expect( getOptimalTextShade( '#c3c3c3' ) ).toBe( 'dark' );
		expect( getOptimalTextShade( '#0ff' ) ).toBe( 'dark' );
	} );
} );
