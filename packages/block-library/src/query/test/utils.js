/**
 * Internal dependencies
 */
import { terms } from './fixtures';
import { getTermsInfo } from '../utils';

describe( 'Query block utils', () => {
	describe( 'getTermsInfo', () => {
		it( 'should return an empty object when no terms provided', () => {
			expect( getTermsInfo() ).toEqual( { terms: undefined } );
		} );
		it( 'should return proper terms info object', () => {
			expect( getTermsInfo( terms ) ).toEqual(
				expect.objectContaining( {
					mapById: expect.objectContaining( {
						4: expect.objectContaining( { name: 'nba' } ),
						11: expect.objectContaining( {
							name: 'featured',
						} ),
					} ),
					mapByName: expect.objectContaining( {
						nba: expect.objectContaining( { id: 4 } ),
						featured: expect.objectContaining( { id: 11 } ),
					} ),
					names: expect.arrayContaining( [ 'nba', 'featured' ] ),
				} )
			);
		} );
	} );
} );
