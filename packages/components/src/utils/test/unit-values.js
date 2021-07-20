/**
 * Internal dependencies
 */
import { createCSSUnitValue, parseCSSUnitValue } from '../unit-values';

describe( 'unit-values', () => {
	describe( 'createCSSUnitValue', () => {
		it.each`
			value     | unit      | output
			${ 100 }  | ${ 'em' } | ${ '100em' }
			${ '40' } | ${ 'vw' } | ${ '40vw' }
		`(
			'should combine $value and $unit to create $output',
			( { value, unit, output } ) =>
				expect( createCSSUnitValue( value, unit ) ).toEqual( output )
		);
	} );

	describe( 'parseCSSUnitValue', () => {
		it.each`
			value                  | output
			${ '10fr' }            | ${ [ 10, 'fr' ] }
			${ '10cm' }            | ${ [ 10, 'cm' ] }
			${ '10mm' }            | ${ [ 10, 'mm' ] }
			${ '10Q' }             | ${ [ 10, 'Q' ] }
			${ '10in' }            | ${ [ 10, 'in' ] }
			${ '10pc' }            | ${ [ 10, 'pc' ] }
			${ '10pt' }            | ${ [ 10, 'pt' ] }
			${ '10px' }            | ${ [ 10, 'px' ] }
			${ 'abc em' }          | ${ [ undefined, undefined ] }
			${ '10ex' }            | ${ [ 10, 'ex' ] }
			${ '10ch' }            | ${ [ 10, 'ch' ] }
			${ '10rem' }           | ${ [ 10, 'rem' ] }
			${ '10lh' }            | ${ [ 10, 'lh' ] }
			${ '10vw' }            | ${ [ 10, 'vw' ] }
			${ '10vh' }            | ${ [ 10, 'vh' ] }
			${ '10vmin' }          | ${ [ 10, 'vmin' ] }
			${ '10vmax' }          | ${ [ 10, 'vmax' ] }
			${ '10 vmax' }         | ${ [ 10, 'vmax' ] }
			${ '10notacssunit' }   | ${ [ undefined, undefined ] }
			${ 'notaunitedvalue' } | ${ [ undefined, undefined ] }
			${ '10' }              | ${ [ 10, undefined ] }
		`( 'should parse $value into $output', ( { value, output } ) =>
			expect( parseCSSUnitValue( value ) ).toEqual( output )
		);
	} );
} );
