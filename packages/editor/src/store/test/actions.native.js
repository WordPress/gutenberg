/**
 * Internal dependencies
 */
import { togglePostTitleSelection } from '../actions';

describe( 'Editor actions', () => {
	describe( 'togglePostTitleSelection', () => {
		it( 'should return the TOGGLE_POST_TITLE_SELECTION action', () => {
			const result = togglePostTitleSelection( true );
			expect( result ).toEqual( {
				type: 'TOGGLE_POST_TITLE_SELECTION',
				isSelected: true,
			} );
		} );
	} );
} );
