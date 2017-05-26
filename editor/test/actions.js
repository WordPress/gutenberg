/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { focusBlock, replaceBlocks } from '../actions';

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
} );
