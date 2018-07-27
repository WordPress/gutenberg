/**
 * Internal dependencies
 */
import {
	replaceBlocks,
	startTyping,
	stopTyping,
	fetchReusableBlocks,
	saveReusableBlock,
	deleteReusableBlock,
	convertBlockToStatic,
	convertBlockToReusable,
	toggleSelection,
	setupEditor,
	resetPost,
	resetBlocks,
	updateBlockAttributes,
	updateBlock,
	selectBlock,
	startMultiSelect,
	stopMultiSelect,
	multiSelect,
	clearSelectedBlock,
	replaceBlock,
	insertBlock,
	insertBlocks,
	showInsertionPoint,
	hideInsertionPoint,
	editPost,
	savePost,
	trashPost,
	mergeBlocks,
	redo,
	undo,
	removeBlocks,
	removeBlock,
	toggleBlockMode,
	createNotice,
	createSuccessNotice,
	createInfoNotice,
	createErrorNotice,
	createWarningNotice,
	removeNotice,
	updateBlockListSettings,
} from '../actions';

describe( 'actions', () => {
	describe( 'setupEditor', () => {
		it( 'should return the SETUP_EDITOR action', () => {
			const post = {};
			const autosave = {};
			const result = setupEditor( post, autosave );
			expect( result ).toEqual( {
				type: 'SETUP_EDITOR',
				post,
				autosave,
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
	describe( 'resetBlocks', () => {
		it( 'should return the RESET_BLOCKS actions', () => {
			const blocks = [];
			const result = resetBlocks( blocks );
			expect( result ).toEqual( {
				type: 'RESET_BLOCKS',
				blocks,
			} );
		} );
	} );

	describe( 'updateBlockAttributes', () => {
		it( 'should return the UPDATE_BLOCK_ATTRIBUTES action', () => {
			const clientId = 'myclientid';
			const attributes = {};
			const result = updateBlockAttributes( clientId, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId,
				attributes,
			} );
		} );
	} );

	describe( 'updateBlock', () => {
		it( 'should return the UPDATE_BLOCK action', () => {
			const clientId = 'myclientid';
			const updates = {};
			const result = updateBlock( clientId, updates );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK',
				clientId,
				updates,
			} );
		} );
	} );

	describe( 'selectBlock', () => {
		it( 'should return the SELECT_BLOCK action', () => {
			const clientId = 'myclientid';
			const result = selectBlock( clientId, -1 );
			expect( result ).toEqual( {
				type: 'SELECT_BLOCK',
				initialPosition: -1,
				clientId,
			} );
		} );
	} );

	describe( 'startMultiSelect', () => {
		it( 'should return the START_MULTI_SELECT', () => {
			expect( startMultiSelect() ).toEqual( {
				type: 'START_MULTI_SELECT',
			} );
		} );
	} );

	describe( 'stopMultiSelect', () => {
		it( 'should return the Stop_MULTI_SELECT', () => {
			expect( stopMultiSelect() ).toEqual( {
				type: 'STOP_MULTI_SELECT',
			} );
		} );
	} );
	describe( 'multiSelect', () => {
		it( 'should return MULTI_SELECT action', () => {
			const start = 'start';
			const end = 'end';
			expect( multiSelect( start, end ) ).toEqual( {
				type: 'MULTI_SELECT',
				start,
				end,
			} );
		} );
	} );

	describe( 'clearSelectedBlock', () => {
		it( 'should return CLEAR_SELECTED_BLOCK action', () => {
			expect( clearSelectedBlock() ).toEqual( {
				type: 'CLEAR_SELECTED_BLOCK',
			} );
		} );
	} );

	describe( 'replaceBlock', () => {
		it( 'should return the REPLACE_BLOCKS action', () => {
			const block = {
				clientId: 'ribs',
			};

			expect( replaceBlock( [ 'chicken' ], block ) ).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks: [ block ],
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( 'replaceBlocks', () => {
		it( 'should return the REPLACE_BLOCKS action', () => {
			const blocks = [ {
				clientId: 'ribs',
			} ];

			expect( replaceBlocks( [ 'chicken' ], blocks ) ).toEqual( {
				type: 'REPLACE_BLOCKS',
				clientIds: [ 'chicken' ],
				blocks,
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( 'insertBlock', () => {
		it( 'should return the INSERT_BLOCKS action', () => {
			const block = {
				clientId: 'ribs',
			};
			const index = 5;
			expect( insertBlock( block, index, 'testclientid' ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks: [ block ],
				index,
				rootClientId: 'testclientid',
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( 'insertBlocks', () => {
		it( 'should return the INSERT_BLOCKS action', () => {
			const blocks = [ {
				clientId: 'ribs',
			} ];
			const index = 3;
			expect( insertBlocks( blocks, index, 'testclientid' ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks,
				index,
				rootClientId: 'testclientid',
				time: expect.any( Number ),
			} );
		} );
	} );

	describe( 'showInsertionPoint', () => {
		it( 'should return the SHOW_INSERTION_POINT action', () => {
			expect( showInsertionPoint() ).toEqual( {
				type: 'SHOW_INSERTION_POINT',
			} );
		} );
	} );

	describe( 'hideInsertionPoint', () => {
		it( 'should return the HIDE_INSERTION_POINT action', () => {
			expect( hideInsertionPoint() ).toEqual( {
				type: 'HIDE_INSERTION_POINT',
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

	describe( 'mergeBlocks', () => {
		it( 'should return MERGE_BLOCKS action', () => {
			const firstBlockClientId = 'blockA';
			const secondBlockClientId = 'blockB';
			expect( mergeBlocks( firstBlockClientId, secondBlockClientId ) ).toEqual( {
				type: 'MERGE_BLOCKS',
				blocks: [ firstBlockClientId, secondBlockClientId ],
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

	describe( 'removeBlocks', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientIds = [ 'clientId' ];
			expect( removeBlocks( clientIds ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				clientIds,
				selectPrevious: true,
			} );
		} );
	} );

	describe( 'removeBlock', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const clientId = 'myclientid';
			expect( removeBlock( clientId ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				clientIds: [
					clientId,
				],
				selectPrevious: true,
			} );
			expect( removeBlock( clientId, false ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				clientIds: [
					clientId,
				],
				selectPrevious: false,
			} );
		} );
	} );

	describe( 'toggleBlockMode', () => {
		it( 'should return TOGGLE_BLOCK_MODE action', () => {
			const clientId = 'myclientid';
			expect( toggleBlockMode( clientId ) ).toEqual( {
				type: 'TOGGLE_BLOCK_MODE',
				clientId,
			} );
		} );
	} );

	describe( 'startTyping', () => {
		it( 'should return the START_TYPING action', () => {
			expect( startTyping() ).toEqual( {
				type: 'START_TYPING',
			} );
		} );
	} );

	describe( 'stopTyping', () => {
		it( 'should return the STOP_TYPING action', () => {
			expect( stopTyping() ).toEqual( {
				type: 'STOP_TYPING',
			} );
		} );
	} );

	describe( 'createNotice', () => {
		const status = 'status';
		const content = <p>element</p>;
		it( 'should return CREATE_NOTICE action when options is empty', () => {
			const result = createNotice( status, content );
			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				notice: {
					status,
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
		it( 'should return CREATE_NOTICE action when options is desined', () => {
			const id = 'my-id';
			const options = {
				id,
				isDismissible: false,
			};
			const result = createNotice( status, content, options );
			expect( result ).toEqual( {
				type: 'CREATE_NOTICE',
				notice: {
					id,
					status,
					content,
					isDismissible: false,
				},
			} );
		} );
	} );

	describe( 'createSuccessNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const content = <p>element</p>;
			const result = createSuccessNotice( content );
			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				notice: {
					status: 'success',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createInfoNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const content = <p>element</p>;
			const result = createInfoNotice( content );
			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				notice: {
					status: 'info',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createErrorNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const content = <p>element</p>;
			const result = createErrorNotice( content );
			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				notice: {
					status: 'error',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'createWarningNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const content = <p>element</p>;
			const result = createWarningNotice( content );
			expect( result ).toMatchObject( {
				type: 'CREATE_NOTICE',
				notice: {
					status: 'warning',
					content,
					isDismissible: true,
					id: expect.any( String ),
				},
			} );
		} );
	} );

	describe( 'removeNotice', () => {
		it( 'should return REMOVE_NOTICE actions', () => {
			const noticeId = 'id';
			expect( removeNotice( noticeId ) ).toEqual( {
				type: 'REMOVE_NOTICE',
				noticeId,
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
				clientId,
			} );
		} );
	} );

	describe( 'toggleSelection', () => {
		it( 'should return the TOGGLE_SELECTION action with default value for isSelectionEnabled = true', () => {
			expect( toggleSelection() ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: true,
			} );
		} );

		it( 'should return the TOGGLE_SELECTION action with isSelectionEnabled = true as passed in the argument', () => {
			expect( toggleSelection( true ) ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: true,
			} );
		} );

		it( 'should return the TOGGLE_SELECTION action with isSelectionEnabled = false as passed in the argument', () => {
			expect( toggleSelection( false ) ).toEqual( {
				type: 'TOGGLE_SELECTION',
				isSelectionEnabled: false,
			} );
		} );
	} );

	describe( 'updateBlockListSettings', () => {
		it( 'should return the UPDATE_BLOCK_LIST_SETTINGS with undefined settings', () => {
			expect( updateBlockListSettings( 'chicken' ) ).toEqual( {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: 'chicken',
				settings: undefined,
			} );
		} );

		it( 'should return the UPDATE_BLOCK_LIST_SETTINGS action with the passed settings', () => {
			expect( updateBlockListSettings( 'chicken', { chicken: 'ribs' } ) ).toEqual( {
				type: 'UPDATE_BLOCK_LIST_SETTINGS',
				clientId: 'chicken',
				settings: { chicken: 'ribs' },
			} );
		} );
	} );
} );
