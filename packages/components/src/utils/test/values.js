/**
 * Internal dependencies
 */
import { isValueNumeric } from '../values';

/**
 * This works because Node 12 ships with `small-icu` instead of `full-icu`
 * meaning it only supports the `en-US` locale. If we test for support of the
 * `pt-BR` locale, we can detect when we're running in a "full-icu" environment
 * i.e., either Node 14+ or previous versions built with the `full-icu` option.
 *
 * Furthermore, this is safe to run in a `jsdom` test environment because, as the
 * issue linked below describes, `jsdom` does not implement the Intl object, instead
 * relying on the relevant Node implementation.
 *
 * @see https://nodejs.org/docs/latest-v12.x/api/intl.html#intl_options_for_building_node_js
 * @see https://nodejs.org/docs/latest-v14.x/api/intl.html#intl_options_for_building_node_js
 * @see https://github.com/jsdom/jsdom/issues/1626
 *
 * @todo Remove when Node 12 is deprecated
 * @param {() => void} testCallback
 */
function scopeTestToFullICU( testCallback ) {
	if ( Intl.NumberFormat.supportedLocalesOf( 'pt-BR' ).length === 1 ) {
		testCallback();
	}
}

describe( 'isValueNumeric', () => {
	scopeTestToFullICU( () => {
		it( 'should handle space separated numbers for various locales', () => {
			expect( isValueNumeric( '1 000.1', 'en-US' ) ).toBe( true );
			expect( isValueNumeric( '1 000.1', 'pt-BR' ) ).toBe( true );
		} );
	} );

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

	scopeTestToFullICU( () => {
		it.each( [
			'999',
			'99,33',
			0.0003,
			2222,
			'22.222.222',
			-888,
			new Number(),
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
} );
