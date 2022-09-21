/**
 * Internal dependencies
 */
import { camelCaseJoin, upperFirst } from '../styles/utils';

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
} );
