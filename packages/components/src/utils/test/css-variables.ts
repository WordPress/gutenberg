/**
 * Internal dependencies
 */
import {
	getCSSVariablesInString,
	replaceCSSVariablesInString,
} from '../css-variables';

describe( 'getCSSVariablesInString', () => {
	it( 'should parse CSS variables from a string', () => {
		const result = getCSSVariablesInString(
			'color: var( --text-color ); background: linear-gradient(135deg, var(--background-color) 0%, var(--background-color-darker-20) 100%);'
		);
		expect( result ).toEqual( [
			'--text-color',
			'--background-color',
			'--background-color-darker-20',
		] );
	} );

	it( 'should parse CSS variables with fallbacks', () => {
		const result = getCSSVariablesInString(
			'color: var(--text-color, #000); background: linear-gradient(135deg, var(--background-color, #fff) 0%, var(--background-color-darker-20, #000) 100%);'
		);
		expect( result ).toEqual( [
			'--text-color',
			'--background-color',
			'--background-color-darker-20',
		] );
	} );
} );

describe( 'replaceCSSVariablesInString', () => {
	it( 'should replace CSS variables in a string', () => {
		const result = replaceCSSVariablesInString(
			'color: var(--text-color); background: linear-gradient(135deg, var(--background-color) 0%, var(--background-color-darker-20) 100%);',
			{
				'--text-color': 'red',
				'--background-color': '#fff',
				'--background-color-darker-20': 'darkblue',
			}
		);
		expect( result ).toEqual(
			'color: red; background: linear-gradient(135deg, #fff 0%, darkblue 100%);'
		);
	} );

	it( 'should replace CSS variables in a string with nested fallbacks', () => {
		const result = replaceCSSVariablesInString(
			'color: var(--text-color, var(--undefined-color, #000)); background: linear-gradient(135deg, var( --undefined-color, var(--background-color, #fff) ) 0%, var(--background-color-darker-20, #000) 100%);',
			{
				'--text-color': 'red',
				'--background-color': 'blue',
				'--background-color-darker-20': 'darkblue',
			}
		);
		expect( result ).toEqual(
			'color: red; background: linear-gradient(135deg, blue 0%, darkblue 100%);'
		);
	} );
} );
