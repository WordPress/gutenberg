/**
 * Internal dependencies
 */
import * as actions from '../actions';

describe( 'actions', () => {
	describe( 'setupEditor', () => {
		it( 'should return the SETUP_EDITOR action', () => {
			const post = {};
			const settings = {};
			const result = actions.setupEditor( post, settings );
			expect( result ).toEqual( {
				type: 'SETUP_EDITOR',
				post: {},
				settings: {},
			} );
		} );
	} );
	describe( 'resetPost', () => {
		it( 'should return the RESET_POST action', () => {
			const post = {};
			const result = actions.resetPost( post );
			expect( result ).toEqual( {
				type: 'RESET_POST',
				post: {},
			} );
		} );
	} );
	describe( 'setupNewPost', () => {
		it( 'should return the SETUP_NEW_POST action', () => {
			const edits = {};
			const result = actions.setupNewPost( edits );
			expect( result ).toEqual( {
				type: 'SETUP_NEW_POST',
				edits: {},
			} );
		} );
	} );
	describe( 'resetBlocks', () => {
		it( 'should return the RESET_BLOCKS actions', () => {
			const blocks = [];
			const result = actions.resetBlocks( blocks );
			expect( result ).toEqual( {
				type: 'RESET_BLOCKS',
				blocks: [],
			} );
		} );
	} );
	describe( 'updateBlockAttributes', () => {
		it( 'should return the UPDATE_BLOCK_ATTRIBUTES action', () => {
			const uid = 'string';
			const attributes = {};
			const result = actions.updateBlockAttributes( uid, attributes );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				uid: 'string',
				attributes: {},
			} );
		} );
	} );
	describe( 'updateBlock', () => {
		it( 'should return the UPDATE_BLOCK action', () => {
			const uid = 'uid';
			const updates = {};
			const result = actions.updateBlock( uid, updates );
			expect( result ).toEqual( {
				type: 'UPDATE_BLOCK',
				uid: 'uid',
				updates: {},
			} );
		} );
	} );
	describe( 'focusBlock', () => {
		it( 'should return the UPDATE_FOCUS action', () => {
			const focusConfig = {
				editable: 'cite',
			};

			expect( actions.focusBlock( 'chicken', focusConfig ) ).toEqual( {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: focusConfig,
			} );
		} );
	} );

	describe( 'selectBlock', () => {
		it( 'should return the SELECT_BLOCK action', () => {
			const uid = 'uid';
			const result = actions.selectBlock( uid );
			expect( result ).toEqual( {
				type: 'SELECT_BLOCK',
				uid: 'uid',
			} );
		} );
	} );
	describe( 'startMultiSelect', () => {
		it( 'should return the START_MULTI_SELECT', () => {
			expect( actions.startMultiSelect() ).toEqual( {
				type: 'START_MULTI_SELECT',
			} );
		} );
	} );
	describe( 'stopMultiSelect', () => {
		it( 'should return the Stop_MULTI_SELECT', () => {
			expect( actions.stopMultiSelect() ).toEqual( {
				type: 'STOP_MULTI_SELECT',
			} );
		} );
	} );
	describe( 'multiSelect', () => {
		it( 'should return MULTI_SELECT action', () => {
			const start = 'start';
			const end = 'end';
			expect( actions.multiSelect( start, end ) ).toEqual( {
				type: 'MULTI_SELECT',
				start: 'start',
				end: 'end',
			} );
		} );
	} );
	describe( 'clearSelectedBlock', () => {
		it( 'should return CLEAR_SELECTED_BLOCK action', () => {
			expect( actions.clearSelectedBlock() ).toEqual( {
				type: 'CLEAR_SELECTED_BLOCK',
			} );
		} );
	} );
	describe( 'replaceBlock', () => {
		it( 'should return the REPLACE_BLOCKS action', () => {
			const blocks = {
				uid: 'ribs',
			};

			expect( actions.replaceBlock( [ 'chicken' ], blocks ) ).toEqual( {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ blocks ],
			} );
		} );
	} );
	describe( 'replaceBlocks', () => {
		it( 'should return the REPLACE_BLOCKS action', () => {
			const blocks = [ {
				uid: 'ribs',
			} ];

			expect( actions.replaceBlocks( [ 'chicken' ], blocks ) ).toEqual( {
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
			const position = 'position';
			expect( actions.insertBlock( block, position ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks: [
					{
						uid: 'ribs',
					},
				],
				position: 'position',
			} );
		} );
	} );
	describe( 'insertBlocks', () => {
		it( 'should return the INSERT_BLOCKS action', () => {
			const block = [ {
				uid: 'ribs',
			} ];
			const position = 'position';
			expect( actions.insertBlocks( block, position ) ).toEqual( {
				type: 'INSERT_BLOCKS',
				blocks: [
					{
						uid: 'ribs',
					},
				],
				position: 'position',
			} );
		} );
	} );

	describe( 'showInsertionPoint', () => {
		it( 'should return the SHOW_INSERTION_POINT action', () => {
			expect( actions.showInsertionPoint() ).toEqual( {
				type: 'SHOW_INSERTION_POINT',
			} );
		} );
	} );
	describe( 'hideInsertionPoint', () => {
		it( 'should return the HIDE_INSERTION_POINT action', () => {
			expect( actions.hideInsertionPoint() ).toEqual( {
				type: 'HIDE_INSERTION_POINT',
			} );
		} );
	} );

	describe( 'setBlockInsertionPoint', () => {
		it( 'should return the SET_BLOCK_INSERTION_POINT action', () => {
			const position = 1;
			expect( actions.setBlockInsertionPoint( position ) ).toEqual( {
				type: 'SET_BLOCK_INSERTION_POINT',
				position: 1,
			} );
		} );
	} );

	describe( 'clearBlockInsertionPoint', () => {
		it( 'should return the CLEAR_BLOCK_INSERTION_POINT action', () => {
			expect( actions.clearBlockInsertionPoint() ).toEqual( {
				type: 'CLEAR_BLOCK_INSERTION_POINT',
			} );
		} );
	} );

	describe( 'editPost', () => {
		it( 'should return EDIT_POST action', () => {
			const edits = { format: 'sample' };
			expect( actions.editPost( edits ) ).toEqual( {
				type: 'EDIT_POST',
				edits: {
					format: 'sample',
				},
			} );
		} );
	} );

	describe( 'savePost', () => {
		it( 'should return REQUEST_POST_UPDATE action', () => {
			expect( actions.savePost() ).toEqual( {
				type: 'REQUEST_POST_UPDATE',
			} );
		} );
	} );
	describe( 'trashPost', () => {
		it( 'should return TRASH_POST action', () => {
			const postId = 1;
			const postType = 'post';
			expect( actions.trashPost( postId, postType ) ).toEqual( {
				type: 'TRASH_POST',
				postId: 1,
				postType: 'post',
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
			expect( actions.mergeBlocks( blockA, blockB ) ).toEqual( {
				type: 'MERGE_BLOCKS',
				blocks: [ {
					uid: 'blockA',
				}, {
					uid: 'blockB',
				} ],
			} );
		} );
	} );

	describe( 'autosave', () => {
		it( 'should return AUTOSAVE action', () => {
			expect( actions.autosave() ).toEqual( {
				type: 'AUTOSAVE',
			} );
		} );
	} );
	describe( 'redo', () => {
		it( 'should return REDO action', () => {
			expect( actions.redo() ).toEqual( {
				type: 'REDO',
			} );
		} );
	} );
	describe( 'undo', () => {
		it( 'should return UNDO action', () => {
			expect( actions.undo() ).toEqual( {
				type: 'UNDO',
			} );
		} );
	} );

	describe( 'removeBlocks', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const uids = [ 'uid' ];
			expect( actions.removeBlocks( uids ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				uids: [
					'uid',
				],
			} );
		} );
	} );
	describe( 'removeBlock', () => {
		it( 'should return REMOVE_BLOCKS action', () => {
			const uid = 'uid';
			expect( actions.removeBlock( uid ) ).toEqual( {
				type: 'REMOVE_BLOCKS',
				uids: [
					'uid',
				],
			} );
		} );
	} );

	describe( 'toggleBlockMode', () => {
		it( 'should return TOGGLE_BLOCK_MODE action', () => {
			const uid = 'uid';
			expect( actions.toggleBlockMode( uid ) ).toEqual( {
				type: 'TOGGLE_BLOCK_MODE',
				uid: 'uid',
			} );
		} );
	} );

	describe( 'startTyping', () => {
		it( 'should return the START_TYPING action', () => {
			expect( actions.startTyping() ).toEqual( {
				type: 'START_TYPING',
			} );
		} );
	} );

	describe( 'stopTyping', () => {
		it( 'should return the STOP_TYPING action', () => {
			expect( actions.stopTyping() ).toEqual( {
				type: 'STOP_TYPING',
			} );
		} );
	} );

	describe( 'toggleSidebar', () => {
		it( 'should return TOGGLE_SIDEBAR action', () => {
			const isMobile = true;
			expect( actions.toggleSidebar( isMobile ) ).toEqual( {
				type: 'TOGGLE_SIDEBAR',
				isMobile: true,
			} );
		} );
	} );

	describe( 'setActivePanel', () => {
		const panel = 'panelName';
		expect( actions.setActivePanel( panel ) ).toEqual( {
			type: 'SET_ACTIVE_PANEL',
			panel: 'panelName',
		} );
	} );
	describe( 'toggleSidebarPanel', () => {
		it( 'should return TOGGLE_SIDEBAR_PANEL action', () => {
			const panel = 'panelName';
			expect( actions.toggleSidebarPanel( panel ) ).toEqual( {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'panelName',
			} );
		} );
	} );

	describe( 'createNotice', () => {
		const status = 'status';
		const content = <p>element</p>;
		it( 'should return CREATE_NOTICE action when options is empty', () => {
			const result = actions.createNotice( status, content );
			expect( result.type ).toEqual( 'CREATE_NOTICE' );
			expect( result.notice.status ).toEqual( 'status' );
			expect( result.notice.content ).toEqual( <p>element</p> );
			expect( result.notice.isDismissible ).toEqual( true );
			expect( result.notice.id ).toBeDefined();
		} );
		it( 'should return CREATE_NOTICE action when options is desined', () => {
			const options = {
				id: 'id',
				isDismissible: false,
			};
			const result = actions.createNotice( status, content, options );
			expect( result ).toEqual( {
				type: 'CREATE_NOTICE',
				notice: {
					id: 'id',
					status: 'status',
					content: <p>element</p>,
					isDismissible: false,
				},
			} );
		} );
	} );
	describe( 'createSuccessNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const result = actions.createSuccessNotice( <p>element</p> );
			expect( result.type ).toEqual( 'CREATE_NOTICE' );
			expect( result.notice.status ).toEqual( 'success' );
			expect( result.notice.content ).toEqual( <p>element</p> );
			expect( result.notice.isDismissible ).toEqual( true );
			expect( result.notice.id ).toBeDefined();
		} );
	} );
	describe( 'createInfoNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const result = actions.createInfoNotice( <p>element</p> );
			expect( result.type ).toEqual( 'CREATE_NOTICE' );
			expect( result.notice.status ).toEqual( 'info' );
			expect( result.notice.content ).toEqual( <p>element</p> );
			expect( result.notice.isDismissible ).toEqual( true );
			expect( result.notice.id ).toBeDefined();
		} );
	} );
	describe( 'createErrorNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const result = actions.createErrorNotice( <p>element</p> );
			expect( result.type ).toEqual( 'CREATE_NOTICE' );
			expect( result.notice.status ).toEqual( 'error' );
			expect( result.notice.content ).toEqual( <p>element</p> );
			expect( result.notice.isDismissible ).toEqual( true );
			expect( result.notice.id ).toBeDefined();
		} );
	} );
	describe( 'createWarningNotice', () => {
		it( 'should return CREATE_NOTICE action', () => {
			const result = actions.createWarningNotice( <p>element</p> );
			expect( result.type ).toEqual( 'CREATE_NOTICE' );
			expect( result.notice.status ).toEqual( 'warning' );
			expect( result.notice.content ).toEqual( <p>element</p> );
			expect( result.notice.isDismissible ).toEqual( true );
			expect( result.notice.id ).toBeDefined();
		} );
	} );
	describe( 'removeNotice', () => {
		it( 'should return REMOVE_NOTICE actions', () => {
			const id = 'id';
			expect( actions.removeNotice( id ) ).toEqual( {
				type: 'REMOVE_NOTICE',
				noticeId: 'id',
			} );
		} );
	} );

	describe( 'metaBoxLoaded', () => {
		it( 'should return META_BOX_LOADED action', () => {
			const location = 'normal';
			expect( actions.metaBoxLoaded( location ) ).toEqual( {
				type: 'META_BOX_LOADED',
				location: 'normal',
			} );
		} );
	} );

	describe( 'toggleFeature', () => {
		it( 'should return TOGGLE_FEATURE action', () => {
			const feature = 'name';
			expect( actions.toggleFeature( feature ) ).toEqual( {
				type: 'TOGGLE_FEATURE',
				feature: 'name',
			} );
		} );
	} );

	describe( 'requestMetaBoxUpdates', () => {
		it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
			expect( actions.requestMetaBoxUpdates( [ 'normal' ] ) ).toEqual( {
				type: 'REQUEST_META_BOX_UPDATES',
				locations: [ 'normal' ],
			} );
		} );
	} );

	describe( 'handleMetaBoxReload', () => {
		it( 'should return the HANDLE_META_BOX_RELOAD action with a location and node', () => {
			expect( actions.handleMetaBoxReload( 'normal' ) ).toEqual( {
				type: 'HANDLE_META_BOX_RELOAD',
				location: 'normal',
			} );
		} );
	} );

	describe( 'metaBoxStateChanged', () => {
		it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
			expect( actions.metaBoxStateChanged( 'normal', true ) ).toEqual( {
				type: 'META_BOX_STATE_CHANGED',
				location: 'normal',
				hasChanged: true,
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

			expect( actions.initializeMetaBoxState( metaBoxes ) ).toEqual( {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes,
			} );
		} );
	} );

	describe( 'fetchReusableBlocks', () => {
		it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
			expect( actions.fetchReusableBlocks() ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
			} );
		} );

		it( 'should take an optional id argument', () => {
			const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( actions.fetchReusableBlocks( id ) ).toEqual( {
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
			expect( actions.updateReusableBlock( id, reusableBlock ) ).toEqual( {
				type: 'UPDATE_REUSABLE_BLOCK',
				id,
				reusableBlock,
			} );
		} );
	} );

	describe( 'saveReusableBlock', () => {
		const id = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( actions.saveReusableBlock( id ) ).toEqual( {
			type: 'SAVE_REUSABLE_BLOCK',
			id,
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( actions.convertBlockToStatic( uid ) ).toEqual( {
			type: 'CONVERT_BLOCK_TO_STATIC',
			uid,
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( actions.convertBlockToReusable( uid ) ).toEqual( {
			type: 'CONVERT_BLOCK_TO_REUSABLE',
			uid,
		} );
	} );
} );
