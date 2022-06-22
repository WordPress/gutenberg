/**
 * Internal dependencies
 */
import { upperFirst } from '../styles/utils';

describe( 'utils', () => {
	describe( 'upperFirst()', () => {
		it( 'should return an string with a capitalized first letter', () => {
			expect( upperFirst( 'toontown' ) ).toEqual( 'Toontown' );
		} );
	} );
} );
