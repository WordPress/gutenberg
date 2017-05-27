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
	savePost,
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

	describe( 'savePost', () => {
		it( 'should return the REQUEST_POST_UPDATE action for a new post', () => {
			expect( savePost( null, { title: 'changed' } ) ).to.eql( {
				type: 'REQUEST_POST_UPDATE',
				edits: { title: 'changed' },
				postId: null,
				isNew: true,
			} );
		} );

		it( 'should return the REQUEST_POST_UPDATE action for an existing post', () => {
			expect( savePost( 1, { title: 'changed' } ) ).to.eql( {
				type: 'REQUEST_POST_UPDATE',
				edits: { title: 'changed' },
				postId: 1,
				isNew: false,
			} );
		} );
	} );
} );
