/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	focusBlock,
	replaceBlocks,
	startTypingInBlock,
	stopTypingInBlock,
} from '../actions';

describe( 'actions', () => {
	describe( 'focusBlock', () => {
		it( 'should return the UPDATE_FOCUS action', () => {
			const focusConfig = {
				editable: 'cite',
			};

			expect( focusBlock( 'chicken', focusConfig ) ).to.eql( {
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

			expect( replaceBlocks( [ 'chicken' ], blocks ) ).to.eql( {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks,
			} );
		} );
	} );

	describe( 'startTypingInBlock', () => {
		it( 'should return the START_TYPING action', () => {
			expect( startTypingInBlock( 'chicken' ) ).to.eql( {
				type: 'START_TYPING',
				uid: 'chicken',
			} );
		} );
	} );

	describe( 'stopTypingInBlock', () => {
		it( 'should return the STOP_TYPING action', () => {
			expect( stopTypingInBlock( 'chicken' ) ).to.eql( {
				type: 'STOP_TYPING',
				uid: 'chicken',
			} );
		} );
	} );
} );
