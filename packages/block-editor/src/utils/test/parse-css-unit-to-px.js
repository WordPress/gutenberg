/**
 * Internal dependencies
 */
import { getPxFromCssUnit } from '../parse-css-unit-to-px';

describe( 'getPxFromCssUnit', () => {
	// Absolute units
	it( 'test px return px unit', () => {
		expect( getPxFromCssUnit( '25px' ) ).toBe( '25px' );
	} );

	it( 'test numeric float return px unit', () => {
		expect( getPxFromCssUnit( '25.5' ) ).toBe( '26px' );
	} );

	it( 'test cm return px unit', () => {
		expect( getPxFromCssUnit( '1cm' ) ).toBe( '38px' );
	} );

	it( 'test mm return px unit', () => {
		expect( getPxFromCssUnit( '10mm' ) ).toBe( '38px' );
	} );

	it( 'test in return px unit', () => {
		expect( getPxFromCssUnit( '1in' ) ).toBe( '96px' );
	} );

	it( 'test pt return px unit', () => {
		expect( getPxFromCssUnit( '12pt' ) ).toBe( '16px' );
	} );

	it( 'test pc return px unit', () => {
		expect( getPxFromCssUnit( '1pc' ) ).toBe( '16px' );
	} );

	it( 'test Q return px unit', () => {
		expect( getPxFromCssUnit( '40Q' ) ).toBe( '38px' ); // 40 Q should be 1 cm
	} );

	// Relative units
	it( 'test em return px unit', () => {
		expect( getPxFromCssUnit( '2em', { fontSize: 10 } ) ).toBe( '20px' );
	} );

	it( 'test rem return px unit', () => {
		expect( getPxFromCssUnit( '2rem', { fontSize: 10 } ) ).toBe( '20px' );
	} );

	it( 'test vw return px unit', () => {
		expect( getPxFromCssUnit( '20vw', { width: 100 } ) ).toBe( '20px' );
	} );

	it( 'test vh return px unit', () => {
		expect( getPxFromCssUnit( '20vh', { height: 200 } ) ).toBe( '40px' );
	} );

	it( 'test vmin return px unit', () => {
		expect(
			getPxFromCssUnit( '20vmin', { height: 200, width: 100 } )
		).toBe( '20px' );
	} );

	it( 'test vmax return px unit', () => {
		expect(
			getPxFromCssUnit( '20vmax', { height: 200, width: 100 } )
		).toBe( '40px' );
	} );

	it( 'test lh return px unit', () => {
		expect( getPxFromCssUnit( '20lh', { lineHeight: 2 } ) ).toBe( '40px' );
	} );

	it( 'test % return px unit', () => {
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
	it( 'test min() return px unit', () => {
		expect( getPxFromCssUnit( 'min(20px, 25px)' ) ).toBe( '20px' );
	} );

	it( 'test min() function with many arguments return px unit', () => {
		expect( getPxFromCssUnit( 'min(20px, 9px, 12pt, 25px)' ) ).toBe(
			'9px'
		);
	} );

	it( 'test max() return px unit', () => {
		expect( getPxFromCssUnit( 'max(20px, 25px)' ) ).toBe( '25px' );
	} );

	it( 'test clamp() lower return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 9px, 25px)' ) ).toBe( '10px' );
	} );

	it( 'test clamp() upper return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 35px, 25px)' ) ).toBe( '25px' );
	} );

	it( 'test clamp() middle return px unit', () => {
		expect( getPxFromCssUnit( 'clamp(10px, 15px, 25px)' ) ).toBe( '15px' );
	} );

	it( 'test nested max min function return px unit', () => {
		expect( getPxFromCssUnit( 'min(max(20px,25px), 35px)' ) ).toBe(
			'25px'
		);
	} );

	it( 'test nested min max function return px unit', () => {
		expect( getPxFromCssUnit( 'max(min(20px,25px), 35px)' ) ).toBe(
			'35px'
		);
	} );

	it( 'test calculate function return px unit', () => {
		expect( getPxFromCssUnit( '10px + 25px' ) ).toBe( '35px' );
	} );

	it( 'test calc(10px + 25px) function return px unit', () => {
		expect( getPxFromCssUnit( 'calc(10px + 25px)' ) ).toBe( '35px' );
	} );

	it( 'test calc( number * cssUnit ) return px unit', () => {
		expect( getPxFromCssUnit( 'calc( 2 * 20px)' ) ).toBe( '40px' );
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

	it( 'test empty string', () => {
		expect( getPxFromCssUnit( '' ) ).toBe( null );
	} );

	it( 'test undefined string', () => {
		expect( getPxFromCssUnit( undefined ) ).toBe( null );
	} );
	it( 'test integer string', () => {
		expect( getPxFromCssUnit( 123 ) ).toBe( '123px' );
	} );

	it( 'test float string', () => {
		expect( getPxFromCssUnit( 123.456 ) ).toBe( '123px' );
	} );

	it( 'test text string', () => {
		expect( getPxFromCssUnit( 'abc' ) ).toBe( null );
	} );

	it( 'test not non function return null', () => {
		expect( getPxFromCssUnit( 'abc + num' ) ).toBe( null );
	} );

	it( 'test not a fishy function return null', () => {
		expect( getPxFromCssUnit( 'console.log("howdy"); + 10px' ) ).toBe(
			null
		);
	} );

	it( 'test not a typo function return null', () => {
		expect( getPxFromCssUnit( 'calc(12vw * 10px' ) ).toBe( null );
	} );
} );
