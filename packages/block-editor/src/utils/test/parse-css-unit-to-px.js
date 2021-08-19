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
	it( 'min() function with many arguments return px unit', () => {
		expect( getPxFromCssUnit( 'min(20px, 9px, 12pt, 25px)' ) ).toBe(
			'9px'
		);
	} );

	it( 'max() return px unit', () => {
		expect( getPxFromCssUnit( 'max(20px, 25px)' ) ).toBe( '25px' );
	} );

	it( 'clamp() lower return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 9px, 25px)' ) ).toBe( '10px' );
	} );

	it( 'clamp() upper return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 35px, 25px)' ) ).toBe( '25px' );
	} );

	it( 'clamp() middle return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 15px, 25px)' ) ).toBe( '15px' );
	} );

	it( 'nested max min function return px unit', () => {
		expect( getPxFromCssUnit( 'min(max(20px,25px), 35px)' ) ).toBe(
			'25px'
		);
	} );

	it( 'nested min max function return px unit', () => {
		expect( getPxFromCssUnit( 'max(min(20px,25px), 35px)' ) ).toBe(
			'35px'
		);
	} );

	it( 'calcualte function return px unit', () => {
		expect( getPxFromCssUnit( '10px + 25px' ) ).toBe( '35px' );
	} );

	it( 'test calc(10px + 25px) function return px unit', () => {
		expect( getPxFromCssUnit( 'calc(10px + 25px)' ) ).toBe( '35px' );
	} );

	it( 'test calc(25px - 10px) function return px unit', () => {
		expect( getPxFromCssUnit( 'calc(25px - 10px)' ) ).toBe( '15px' );
	} );

	it( 'test min(10px + 25px, 55pt) function return px unit', () => {
		expect( getPxFromCssUnit( 'min(10px + 25px, 55pt)' ) ).toBe( '35px' );
	} );

	it( 'test calc(12vw * 10px) function return px unit', () => {
		expect( getPxFromCssUnit( 'calc(12vw * 10px)' ) ).toBe( '450px' );
	} );

	it( 'test calc(42vw / 10px) function return px unit', () => {
		expect( getPxFromCssUnit( 'calc(45vw / 10px)' ) ).toBe( '17px' );
	} );
} );
