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
	] )(
		'should return `true` for numeric values %s for locale with comma delimiter',
		( x ) => {
			expect( isValueNumeric( x, 'en-US' ) ).toBe( true );
		}
	);

	it.each( [ null, , 'Stringy', {}, [] ] )(
		'should return `false` for non-numeric value %s for locale with comma delimiter',
		( x ) => {
			expect( isValueNumeric( x, 'en-US' ) ).toBe( false );
		}
	);

	it.only.each( [
		// '999',
		// '99,33',
		// 0.0003,
		// 2222,
		'22.222.222',
		// -888,
		// new Number(),
	] )(
		'should return `true` for numeric values %s for locale with period delimiter',
		( x ) => {
			expect( isValueNumeric( x, 'pt-BR' ) ).toBe( true );
		}
	);

	it.each( [ null, , 'Stringy', {}, [] ] )(
		'should return `false` for non-numeric value %s for locale with period delimiter',
		( x ) => {
			expect( isValueNumeric( x, 'pt-BR' ) ).toBe( false );
		}
	);
} );
