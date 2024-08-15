/**
 * Internal dependencies
 */
import { getEditedPostType, getEditedPostId, isPage } from '../selectors';

describe( 'selectors', () => {
	describe( 'getEditedPostId', () => {
		it( 'returns the template ID', () => {
			const state = { editedPost: { id: 10 } };
			expect( getEditedPostId( state ) ).toBe( 10 );
		} );
	} );

	describe( 'getEditedPostType', () => {
		it( 'returns the template type', () => {
			const state = { editedPost: { postType: 'wp_template' } };
			expect( getEditedPostType( state ) ).toBe( 'wp_template' );
		} );
	} );

	describe( 'isPage', () => {
		it( 'returns true if the edited post type is a page', () => {
			const state = {
				editedPost: {
					postType: 'wp_template',
					context: { postType: 'page', postId: 123 },
				},
			};
			expect( isPage( state ) ).toBe( true );
		} );

		it( 'returns false if the edited post type is a template', () => {
			const state = {
				editedPost: {
					postType: 'wp_template',
				},
			};
			expect( isPage( state ) ).toBe( false );
		} );
	} );
} );
