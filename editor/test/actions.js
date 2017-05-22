/**
 * External dependencies
 */
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * WordPress dependencies
 */
import { getBlocks, unregisterBlock, registerBlock, createBlock } from 'blocks';

/**
 * Internal dependencies
 */
import { focusBlock, replaceBlocks, mergeBlocks } from '../actions';

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

	describe( 'mergeBlocks', () => {
		afterEach( () => {
			getBlocks().forEach( ( block ) => {
				unregisterBlock( block.slug );
			} );
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlock( 'core/test-block', {} );
			const blockA = {
				uid: 'chicken',
				blockType: 'core/test-block',
			};
			const blockB = {
				uid: 'ribs',
				blockType: 'core/test-block',
			};
			const dispatch = sinon.spy();
			mergeBlocks( dispatch, blockA, blockB );

			expect( dispatch ).to.have.been.calledOnce();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlock( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			const blockA = {
				uid: 'chicken',
				blockType: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				blockType: 'core/test-block',
				attributes: { content: 'ribs' },
			};
			const dispatch = sinon.spy();
			mergeBlocks( dispatch, blockA, blockB );

			expect( dispatch ).to.have.been.calledTwice();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).to.have.been.calledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				blockType: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlock( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			registerBlock( 'core/test-block-2', {} );
			const blockA = {
				uid: 'chicken',
				blockType: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				blockType: 'core/test-block2',
				attributes: { content: 'ribs' },
			};
			const dispatch = sinon.spy();
			mergeBlocks( dispatch, blockA, blockB );

			expect( dispatch ).to.have.not.been.called();
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlock( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			registerBlock( 'core/test-block-2', {
				transforms: {
					to: [ {
						type: 'blocks',
						blocks: [ 'core/test-block' ],
						transform: ( { content2 } ) => {
							return createBlock( 'core/test-block', {
								content: content2,
							} );
						},
					} ],
				},
			} );
			const blockA = {
				uid: 'chicken',
				blockType: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				blockType: 'core/test-block-2',
				attributes: { content2: 'ribs' },
			};
			const dispatch = sinon.spy();
			mergeBlocks( dispatch, blockA, blockB );

			expect( dispatch ).to.have.been.calledTwice();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).to.have.been.calledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				blockType: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );
	} );
} );
