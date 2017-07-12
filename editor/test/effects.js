/**
 * External dependencies
 */
import { noop } from 'lodash';

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
	const defaultBlockSettings = { save: noop };

	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
			};
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
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
				save: noop,
			} );
			registerBlockType( 'core/test-block-2', defaultBlockSettings );
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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should transform and merge the blocks', () => {
			registerBlockType( 'core/test-block', {
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
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
				save: noop,
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
			const dispatch = jest.fn();
			handler( mergeBlocks( blockA, blockB ), { dispatch } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );
	} );
} );
