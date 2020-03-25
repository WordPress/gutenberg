/**
 * Internal dependencies
 */
import { getCSSVariables } from '../style';

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
