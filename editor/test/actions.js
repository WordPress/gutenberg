/**
 * Internal dependencies
 */
import {
	focusBlock,
	replaceBlocks,
	startTyping,
	stopTyping,
	fetchReusableBlocks,
	addReusableBlocks,
	saveReusableBlock,
	attachBlock,
	detachBlock,
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

	describe( 'fetchReusableBlocks', () => {
		it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
			expect( fetchReusableBlocks() ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: null,
			} );
		} );

		it( 'should take an optional id argument', () => {
			expect( fetchReusableBlocks( '358b59ee-bab3-4d6f-8445-e8c6971a5605' ) ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
			} );
		} );
	} );

	describe( 'addReusableBlocks', () => {
		it( 'should return the ADD_REUSABLE_BLOCKS action', () => {
			const reusableBlock = {
				id: '358b59ee-bab3-4d6f-8445-e8c6971a5605',
				name: 'My cool block',
				type: 'core/paragraph',
				attributes: {
					content: 'Hello!',
				},
			};
			expect( addReusableBlocks( reusableBlock ) ).toEqual( {
				type: 'ADD_REUSABLE_BLOCKS',
				reusableBlocks: [ reusableBlock ],
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

	describe( 'attachBlock', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( attachBlock( uid ) ).toEqual( {
			type: 'ATTACH_BLOCK',
			uid,
		} );
	} );

	describe( 'detachBlock', () => {
		const uid = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		expect( detachBlock( uid ) ).toEqual( {
			type: 'DETACH_BLOCK',
			uid,
		} );
	} );
} );
