/**
 * Internal dependencies
 */
import { getCSSVariables, getInlineStyles } from '../style';

describe( 'getCSSVariables', () => {
	it( 'should return an empty object when called with undefined', () => {
		expect( getCSSVariables() ).toEqual( {} );
	} );

	it( 'should return the correct simple CSS variables', () => {
		expect( getCSSVariables( { color: 'red' } ) ).toEqual( {
			'--wp--color': 'red',
		} );
	} );

	it( 'should omit CSS variables when the provided value is falsy', () => {
		expect( getCSSVariables( { color: undefined } ) ).toEqual( {} );
	} );

	it( 'should flatten nested style config', () => {
		expect(
			getCSSVariables( {
				color: { text: 'red' },
				typography: { lineHeight: 1.5 },
			} )
		).toEqual( {
			'--wp--color--text': 'red',
			'--wp--typography--line-height': 1.5,
		} );
	} );
} );

describe( 'getInlineStyles', () => {
	it( 'should return an empty object when called with undefined', () => {
		expect( getInlineStyles() ).toEqual( {} );
	} );

	it( 'should ignore unknown styles', () => {
		expect( getInlineStyles( { color: 'red' } ) ).toEqual( {} );
	} );

	it( 'should return the correct inline styles', () => {
		expect(
			getInlineStyles( {
				color: { text: 'red', background: 'black' },
				typography: { lineHeight: 1.5 },
			} )
		).toEqual( {
			backgroundColor: 'black',
			color: 'red',
			lineHeight: 1.5,
		} );
	} );
} );
