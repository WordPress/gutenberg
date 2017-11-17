/**
 * Internal dependencies
 */
import {
	focusBlock,
	replaceBlocks,
	startTyping,
	stopTyping,
	requestMetaBoxUpdates,
	handleMetaBoxReload,
	metaBoxStateChanged,
	initializeMetaBoxState,
	fetchReusableBlocks,
	updateReusableBlock,
	saveReusableBlock,
	convertBlockToStatic,
	convertBlockToReusable,
} from '../actions';

describe( 'actions', () => {
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

	describe( 'requestMetaBoxUpdates', () => {
		it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
			expect( requestMetaBoxUpdates( [ 'normal' ] ) ).toEqual( {
				type: 'REQUEST_META_BOX_UPDATES',
				locations: [ 'normal' ],
			} );
		} );
	} );

	describe( 'handleMetaBoxReload', () => {
		it( 'should return the HANDLE_META_BOX_RELOAD action with a location and node', () => {
			expect( handleMetaBoxReload( 'normal' ) ).toEqual( {
				type: 'HANDLE_META_BOX_RELOAD',
				location: 'normal',
			} );
		} );
	} );

	describe( 'metaBoxStateChanged', () => {
		it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
			expect( metaBoxStateChanged( 'normal', true ) ).toEqual( {
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
} );
