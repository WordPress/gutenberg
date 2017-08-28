/**
 * Internal dependencies
 */
import {
	focusBlock,
	replaceBlocks,
	startTyping,
	stopTyping,
	requestMetaboxUpdate,
	handleMetaboxReload,
	metaboxStateChanged,
	initializeMetaboxState,
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

	describe( 'requestMetaboxUpdate', () => {
		it( 'should return the REQUEST_METABOX_UPDATE action', () => {
			expect( requestMetaboxUpdate( 'normal' ) ).toEqual( {
				type: 'REQUEST_METABOX_UPDATE',
				location: 'normal',
			} );
		} );
	} );

	describe( 'handleMetaboxReload', () => {
		it( 'should return the HANDLE_METABOX_RELOAD action with a location and node', () => {
			expect( handleMetaboxReload( 'normal' ) ).toEqual( {
				type: 'HANDLE_METABOX_RELOAD',
				location: 'normal',
			} );
		} );
	} );

	describe( 'metaboxStateChanged', () => {
		it( 'should return the METABOX_STATE_CHANGED action with a hasChanged flag', () => {
			expect( metaboxStateChanged( 'normal', true ) ).toEqual( {
				type: 'METABOX_STATE_CHANGED',
				location: 'normal',
				hasChanged: true,
			} );
		} );
	} );

	describe( 'initializeMetaboxState', () => {
		it( 'should return the METABOX_STATE_CHANGED action with a hasChanged flag', () => {
			const metaboxes = {
				side: true,
				normal: true,
				advanced: false,
			};

			expect( initializeMetaboxState( metaboxes ) ).toEqual( {
				type: 'INITIALIZE_METABOX_STATE',
				metaboxes,
			} );
		} );
	} );
} );
