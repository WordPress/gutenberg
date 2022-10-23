/**
 * Internal dependencies
 */
import {
	camelCaseJoin,
	getCSSVarFromStyleValue,
	upperFirst,
} from '../styles/utils';

describe( 'utils', () => {
	describe( 'upperFirst()', () => {
		it( 'should return an string with a capitalized first letter', () => {
			expect( upperFirst( 'toontown' ) ).toEqual( 'Toontown' );
		} );
	} );

	describe( 'camelCaseJoin()', () => {
		it( 'should return a camelCase string', () => {
			expect( camelCaseJoin( [ 'toon', 'town' ] ) ).toEqual( 'toonTown' );
		} );
	} );

	describe( 'getCSSVarFromStyleValue()', () => {
		it( 'should return a compiled CSS var', () => {
			expect(
				getCSSVarFromStyleValue( 'var:preset|color|yellow-bun' )
			).toEqual( 'var(--wp--preset--color--yellow-bun)' );
		} );

		it( 'should kebab case numbers', () => {
			expect(
				getCSSVarFromStyleValue( 'var:preset|font-size|h1' )
			).toEqual( 'var(--wp--preset--font-size--h-1)' );
		} );

		it( 'should kebab case camel case', () => {
			expect(
				getCSSVarFromStyleValue( 'var:preset|color|heavenlyBlue' )
			).toEqual( 'var(--wp--preset--color--heavenly-blue)' );
		} );
	} );
} );
