/**
 * Internal dependencies
 */
import { getPxFromCssUnit } from '../parse-css-unit-to-px';

describe( 'getPxFromCssUnit', () => {
	// Absolute units
	it( 'px return px unit', () => {
		expect( getPxFromCssUnit( '25px' ) ).toBe( '25px' );
	} );

	it( 'cm return px unit', () => {
		expect( getPxFromCssUnit( '1cm' ) ).toBe( '38px' );
	} );

	it( 'mm return px unit', () => {
		expect( getPxFromCssUnit( '10mm' ) ).toBe( '38px' );
	} );

	it( 'in return px unit', () => {
		expect( getPxFromCssUnit( '1in' ) ).toBe( '96px' );
	} );

	it( 'pt return px unit', () => {
		expect( getPxFromCssUnit( '12pt' ) ).toBe( '16px' );
	} );

	it( 'pc return px unit', () => {
		expect( getPxFromCssUnit( '1pc' ) ).toBe( '16px' );
	} );

	// Relative units
	it( 'em return px unit', () => {
		expect( getPxFromCssUnit( '2em', { fontSize: 10 } ) ).toBe( '20px' );
	} );

	it( 'rem return px unit', () => {
		expect( getPxFromCssUnit( '2rem', { fontSize: 10 } ) ).toBe( '20px' );
	} );

	it( 'vw return px unit', () => {
		expect( getPxFromCssUnit( '20vw', { width: 100 } ) ).toBe( '20px' );
	} );

	it( 'vh return px unit', () => {
		expect( getPxFromCssUnit( '20vh', { height: 200 } ) ).toBe( '40px' );
	} );

	it( 'vmin return px unit', () => {
		expect(
			getPxFromCssUnit( '20vmin', { height: 200, width: 100 } )
		).toBe( '20px' );
	} );

	it( 'vmax return px unit', () => {
		expect(
			getPxFromCssUnit( '20vmax', { height: 200, width: 100 } )
		).toBe( '40px' );
	} );

	it( '% return px unit', () => {
		expect(
			getPxFromCssUnit( '120%', {
				height: 200,
				width: 100,
				fontSize: 10,
				type: 'font',
			} )
		).toBe( '12px' );
	} );
	// Function units
	it( 'min() return px unit', () => {
		expect( getPxFromCssUnit( 'min(20px, 25px)' ) ).toBe( '20px' );
	} );

	it( 'max() return px unit', () => {
		expect( getPxFromCssUnit( 'max(20px, 25px)' ) ).toBe( '25px' );
	} );
} );
