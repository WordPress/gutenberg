/**
 * Internal dependencies
 */
import { isPostTitleSelected } from '../selectors';

describe( 'selectors native', () => {
	describe( 'isPostTitleSelected', () => {
		it( 'should return true if the post title is selected', () => {
			const state = {
				postTitle: {
					isSelected: true,
				},
			};

			expect( isPostTitleSelected( state ) ).toBe( true );
		} );

		it( 'should return false if the post title is not selected', () => {
			const state = {
				postTitle: {
					isSelected: false,
				},
			};

			expect( isPostTitleSelected( state ) ).toBe( false );
		} );
	} );
} );
