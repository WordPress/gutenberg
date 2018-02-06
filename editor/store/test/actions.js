/**
 * Internal dependencies
 */
import {
	focusBlock,
	replaceBlocks,
	startTyping,
	stopTyping,
	requestMetaBoxUpdates,
	initializeMetaBoxState,
	fetchReusableBlocks,
	updateReusableBlock,
	saveReusableBlock,
	deleteReusableBlock,
	convertBlockToStatic,
	convertBlockToReusable,
	toggleSelection,
	setupEditor,
	resetPost,
	setupNewPost,
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
	autosave,
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
} from '../actions';

describe( 'actions', () => {
	describe( 'setupEditor', () => {
		it( 'should return the SETUP_EDITOR action', () => {
			const post = {};
			const settings = {};
			const result = setupEditor( post, settings );
			expect( result ).toEqual( {
				type: 'SETUP_EDITOR',
				post,
				settings,
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

	describe( 'setupNewPost', () => {
		it( 'should return the SETUP_NEW_POST action', () => {
			const edits = {};
			const result = setupNewPost( edits );
			expect( result ).toEqual( {
				type: 'SETUP_NEW_POST',
				edits,
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
			const uid = 'my-uid';
			const attributes = {};
			const result = updateBlockAttributes( uid, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				uid,
				attributes,
			} );
		} );
	} );

	describe( 'updateBlock', () => {
		it( 'should return the UPDATE_BLOCK action', () => {
			const uid = 'myuid';
			const updates = {};
			const result = updateBlock( uid, updates );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK',
				uid,
				updates,
			} );
		} );
	} );

	describe( 'focusBlock', () => {
		it( 'should return the UPDATE_FOCUS action', () => {
			const focusConfig = {
				editable: 'cite',
			};

			expect( focusBlock( 'chicken', focusConfig ) ).toEqual( {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: focusConfig,
			} );
		} );
	} );

	describe( 'selectBlock', () => {
		it( 'should return the SELECT_BLOCK action', () => {
			const uid = 'my-uid';
			const result = selectBlock( uid );
			expect( result ).toEqual( {
				type: 'SELECT_BLOCK',
				uid,
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
				uid: 'ribs',
			};

			expect( replaceBlock( [ 'chicken' ], block ) ).toEqual( {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ block ],
			} );
		} );
	} );

	describe( 'replaceBlocks', () => {
		it( 'should return the REPLACE_BLOCKS action', () => {
			const blocks = [ {
				uid: 'ribs',
			} ];

			expect( replaceBlocks( [ 'chicken' ], blocks ) ).toEqual( {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks,
			} );
		} );
	} );

	describe( 'insertBlock', () => {
		it( 'should return the INSERT_BLOCKS action', () => {
			const block = {
				uid: 'ribs',
			};
			const index = 5;
			expect( insertBlock( block, index ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks: [ block ],
				index,
			} );
		} );
	} );

	describe( 'insertBlocks', () => {
		it( 'should return the INSERT_BLOCKS action', () => {
			const blocks = [ {
				uid: 'ribs',
			} ];
			const index = 3;
			expect( insertBlocks( blocks, index ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks,
				index,
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
			const blockA = {
				uid: 'blockA',
			};
			const blockB = {
				uid: 'blockB',
			};
			expect( mergeBlocks( blockA, blockB ) ).toEqual( {
				type: 'MERGE_BLOCKS',
				blocks: [ blockA, blockB ],
			} );
		} );
	} );

	describe( 'autosave', () => {
		it( 'should return AUTOSAVE action', () => {
			expect( autosave() ).toEqual( {
				type: 'AUTOSAVE',
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
			const uids = [ 'uid' ];
			expect( removeBlocks( uids ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				uids,
			} );
		} );
	} );

	describe( 'removeBlock', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const uid = 'my-uid';
			expect( removeBlock( uid ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				uids: [
					uid,
				],
			} );
		} );
	} );

	describe( 'toggleBlockMode', () => {
		it( 'should return TOGGLE_BLOCK_MODE action', () => {
			const uid = 'my-uid';
			expect( toggleBlockMode( uid ) ).toEqual( {
				type: 'TOGGLE_BLOCK_MODE',
				uid,
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

	describe( 'requestMetaBoxUpdates', () => {
		it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
			expect( requestMetaBoxUpdates() ).toEqual( {
				type: 'REQUEST_META_BOX_UPDATES',
			} );
		} );
	} );

	describe( 'initializeMetaBoxState', () => {
		it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
			const metaBoxes = {
				side: true,
				normal: true,
				advanced: false,
			};

			expect( initializeMetaBoxState( metaBoxes ) ).toEqual( {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes,
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
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( fetchReusableBlocks( id ) ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id,
			} );
		} );
	} );

	describe( 'updateReusableBlock', () => {
		it( 'should return the UPDATE_REUSABLE_BLOCK action', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			const reusableBlock = {
				id,
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};
			expect( updateReusableBlock( id, reusableBlock ) ).toEqual( {
				type: 'UPDATE_REUSABLE_BLOCK',
				id,
				reusableBlock,
			} );
		} );
	} );

	describe( 'saveReusableBlock', () => {
		const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( saveReusableBlock( id ) ).toEqual( {
			type: 'SAVE_REUSABLE_BLOCK',
			id,
		} );
	} );

	describe( 'deleteReusableBlock', () => {
		const id = 123;
		expect( deleteReusableBlock( id ) ).toEqual( {
			type: 'DELETE_REUSABLE_BLOCK',
			id,
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( convertBlockToStatic( uid ) ).toEqual( {
			type: 'CONVERT_BLOCK_TO_STATIC',
			uid,
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( convertBlockToReusable( uid ) ).toEqual( {
			type: 'CONVERT_BLOCK_TO_REUSABLE',
			uid,
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
} );
