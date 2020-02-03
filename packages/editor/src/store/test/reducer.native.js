/**
 * Internal dependencies
 */
import { postTitle } from '../reducer';

describe( 'state native', () => {
	describe( 'postTitle', () => {
		describe( 'isSelected()', () => {
			it( 'should not be selected by default', () => {
				expect( postTitle( undefined, {} ).isSelected ).toBe( false );
			} );

			it( 'should return false if not selecting the post title', () => {
				const action = {
					type: 'TOGGLE_POST_TITLE_SELECTION',
					isSelected: false,
				};

				expect(
					postTitle( { isSelected: true }, action ).isSelected
				).toBe( false );
			} );

			it( 'should return true if selecting the post title', () => {
				const action = {
					type: 'TOGGLE_POST_TITLE_SELECTION',
					isSelected: true,
				};

				expect(
					postTitle( { isSelected: false }, action ).isSelected
				).toBe( true );
			} );
		} );
	} );
} );
