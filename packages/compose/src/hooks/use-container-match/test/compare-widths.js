/**
 * Internal dependencies
 */
import compareWidths from '../compare-widths';

describe( 'compareWidths()', () => {
	it( 'should return true if container width < query', () => {
		expect( compareWidths( '<', 300, 100 ) ).toBe( true );
	} );

	it( 'should return true if container width <= query', () => {
		expect( compareWidths( '<=', 300, 300 ) ).toBe( true );
	} );

	it( 'should return true if container width === query', () => {
		expect( compareWidths( '=', 300, 300 ) ).toBe( true );
	} );

	it( 'should return true if container width !== query', () => {
		expect( compareWidths( '!==', 100, 300 ) ).toBe( true );
	} );

	it( 'should return true if container width > query', () => {
		expect( compareWidths( '>', 100, 300 ) ).toBe( true );
	} );

	it( 'should return true if container width ">=" query', () => {
		expect( compareWidths( '>=', 300, 300 ) ).toBe( true );
	} );

	it( 'should throw an error when operator is wrong', () => {
		expect( () => compareWidths( '=>', 300, 300 ) ).toThrow(
			new Error( 'Unsupported operator: =>' )
		);
	} );
} );
