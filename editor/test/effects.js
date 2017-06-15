/**
 * External dependencies
 */
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType, registerBlockType, createBlock } from 'blocks';

/**
 * Internal dependencies
 */
import { mergeBlocks, focusBlock, replaceBlocks } from '../actions';
import effects from '../effects';

describe( 'effects', () => {
	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', {} );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
			};
			const dispatch = sinon.spy();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).to.have.been.calledOnce();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
			};
			const dispatch = sinon.spy();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).to.have.been.calledTwice();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).to.have.been.calledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			registerBlockType( 'core/test-block-2', {} );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block2',
				attributes: { content: 'ribs' },
			};
			const dispatch = sinon.spy();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).to.not.have.been.called();
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
			} );
			registerBlockType( 'core/test-block-2', {
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
				name: 'core/test-block',
				attributes: { content: 'chicken' },
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block-2',
				attributes: { content2: 'ribs' },
			};
			const dispatch = sinon.spy();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).to.have.been.calledTwice();
			expect( dispatch ).to.have.been.calledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).to.have.been.calledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );
	} );
} );
