/**
 * Internal dependencies
 */
import { isValueNumeric } from '../values';

describe( 'isValueNumeric', () => {
	it.each( [
		'999',
		'99.33',
		0.0003,
		2222,
		'22,222,222',
		-888,
		new Number(),
	] )( 'should return `true` for numeric values %s', ( x ) => {
		expect( isValueNumeric( x ) ).toBe( true );
	} );

	it.each( [ null, , 'Stringy', {}, [] ] )(
		'should return `false` for non-numeric value %s',
		( x ) => {
			expect( isValueNumeric( x ) ).toBe( false );
		}
	);
} );
