/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	getCanUserCreateMedia,
	getEditedPostType,
	getEditedPostId,
	isInserterOpened,
	isListViewOpened,
	isPage,
	hasPageContentFocus,
} from '../selectors';

describe( 'selectors', () => {
	const canUser = jest.fn( () => true );
	getCanUserCreateMedia.registry = {
		select: jest.fn( () => ( { canUser } ) ),
	};

	describe( 'getCanUserCreateMedia', () => {
		it( "selects `canUser( 'create', 'media' )` from the core store", () => {
			expect( getCanUserCreateMedia() ).toBe( true );
			expect(
				getCanUserCreateMedia.registry.select
			).toHaveBeenCalledWith( coreDataStore );
			expect( canUser ).toHaveBeenCalledWith( 'create', 'media' );
		} );
	} );

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

	describe( 'isInserterOpened', () => {
		it( 'returns the block inserter panel isOpened state', () => {
			const state = {
				blockInserterPanel: true,
			};
			expect( isInserterOpened( state ) ).toBe( true );
			state.blockInserterPanel = false;
			expect( isInserterOpened( state ) ).toBe( false );
		} );
	} );

	describe( 'isListViewOpened', () => {
		it( 'returns the list view panel isOpened state', () => {
			const state = {
				listViewPanel: true,
			};
			expect( isListViewOpened( state ) ).toBe( true );
			state.listViewPanel = false;
			expect( isListViewOpened( state ) ).toBe( false );
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

	describe( 'hasPageContentFocus', () => {
		it( 'returns true if locked and the edited post type is a page', () => {
			const state = {
				editedPost: {
					postType: 'wp_template',
					context: { postType: 'page', postId: 123 },
				},
				hasPageContentFocus: true,
			};
			expect( hasPageContentFocus( state ) ).toBe( true );
		} );

		it( 'returns false if not locked and the edited post type is a page', () => {
			const state = {
				editedPost: {
					postType: 'wp_template',
					context: { postType: 'page', postId: 123 },
				},
				hasPageContentFocus: false,
			};
			expect( hasPageContentFocus( state ) ).toBe( false );
		} );

		it( 'returns false if locked and the edited post type is a template', () => {
			const state = {
				editedPost: {
					postType: 'wp_template',
				},
				hasPageContentFocus: true,
			};
			expect( hasPageContentFocus( state ) ).toBe( false );
		} );
	} );
} );
