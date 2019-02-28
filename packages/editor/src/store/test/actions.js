/**
 * Internal dependencies
 */
import {
	__experimentalFetchReusableBlocks as fetchReusableBlocks,
	__experimentalSaveReusableBlock as saveReusableBlock,
	__experimentalDeleteReusableBlock as deleteReusableBlock,
	__experimentalConvertBlockToStatic as convertBlockToStatic,
	__experimentalConvertBlockToReusable as convertBlockToReusable,
	setupEditor,
	resetPost,
	editPost,
	savePost,
	trashPost,
	redo,
	undo,
} from '../actions';

describe( 'actions', () => {
	describe( 'setupEditor', () => {
		it( 'should return the SETUP_EDITOR action', () => {
			const post = {};
			const result = setupEditor( post );
			expect( result ).toEqual( {
				type: 'SETUP_EDITOR',
				post,
			} );
		} );
	} );

	describe( 'resetPost', () => {
		it( 'should return the RESET_POST action', () => {
			const post = {};
			const result = resetPost( post );
			expect( result ).toEqual( {
				type: 'RESET_POST',
				post,
			} );
		} );
	} );

	describe( 'editPost', () => {
		it( 'should return EDIT_POST action', () => {
			const edits = { format: 'sample' };
			expect( editPost( edits ) ).toEqual( {
				type: 'EDIT_POST',
				edits,
			} );
		} );
	} );

	describe( 'savePost', () => {
		it( 'should return REQUEST_POST_UPDATE action', () => {
			expect( savePost() ).toEqual( {
				type: 'REQUEST_POST_UPDATE',
				options: {},
			} );
		} );

		it( 'should pass through options argument', () => {
			expect( savePost( { autosave: true } ) ).toEqual( {
				type: 'REQUEST_POST_UPDATE',
				options: { autosave: true },
			} );
		} );
	} );

	describe( 'trashPost', () => {
		it( 'should return TRASH_POST action', () => {
			const postId = 1;
			const postType = 'post';
			expect( trashPost( postId, postType ) ).toEqual( {
				type: 'TRASH_POST',
				postId,
				postType,
			} );
		} );
	} );

	describe( 'redo', () => {
		it( 'should return REDO action', () => {
			expect( redo() ).toEqual( {
				type: 'REDO',
			} );
		} );
	} );

	describe( 'undo', () => {
		it( 'should return UNDO action', () => {
			expect( undo() ).toEqual( {
				type: 'UNDO',
			} );
		} );
	} );

	describe( 'fetchReusableBlocks', () => {
		it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
			expect( fetchReusableBlocks() ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
			} );
		} );

		it( 'should take an optional id argument', () => {
			expect( fetchReusableBlocks( 123 ) ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: 123,
			} );
		} );
	} );

	describe( 'saveReusableBlock', () => {
		it( 'should return the SAVE_REUSABLE_BLOCK action', () => {
			expect( saveReusableBlock( 123 ) ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
	} );

	describe( 'deleteReusableBlock', () => {
		it( 'should return the DELETE_REUSABLE_BLOCK action', () => {
			expect( deleteReusableBlock( 123 ) ).toEqual( {
				type: 'DELETE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should return the CONVERT_BLOCK_TO_STATIC action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( convertBlockToStatic( clientId ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				clientId,
			} );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should return the CONVERT_BLOCK_TO_REUSABLE action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( convertBlockToReusable( clientId ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_REUSABLE',
				clientIds: [ clientId ],
			} );
		} );
	} );
} );
