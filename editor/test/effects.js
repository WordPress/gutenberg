/**
 * External dependencies
 */
import { noop } from 'lodash';
import uuid from 'uuid/v4';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType, registerBlockType, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	resetPost,
	setupNewPost,
	mergeBlocks,
	focusBlock,
	replaceBlocks,
	editPost,
	savePost,
	addReusableBlock,
	saveReusableBlock,
	attachBlock,
	detachBlock,
} from '../actions';
import effects from '../effects';
import * as selectors from '../selectors';

jest.mock( 'uuid/v4' );
jest.mock( '../selectors' );

describe( 'effects', () => {
	const defaultBlockSettings = { save: () => 'Saved', category: 'common', title: 'block title' };

	beforeEach( () => jest.resetAllMocks() );

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
				category: 'common',
				title: 'test block',
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
				category: 'common',
				title: 'test block',
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
				attributes: {
					content: {
						type: 'string',
					},
				},
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
				title: 'test block',
			} );
			registerBlockType( 'core/test-block-2', {
				attributes: {
					content: {
						type: 'string',
					},
				},
				transforms: {
					to: [ {
						type: 'block',
						blocks: [ 'core/test-block' ],
						transform: ( { content2 } ) => {
							return createBlock( 'core/test-block', {
								content: content2,
							} );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'test block 2',
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

	describe( '.AUTOSAVE', () => {
		const handler = effects.AUTOSAVE;
		const dispatch = jest.fn();
		const store = { getState: () => {}, dispatch };

		it( 'should do nothing for unsaveable', () => {
			selectors.isEditedPostSaveable.mockReturnValue( false );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should do nothing for clean', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( false );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( false );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should return autosave action for clean, new, saveable post', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( false );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( editPost( { status: 'draft' } ) );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
		} );

		it( 'should return autosave action for saveable, dirty, published post', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( true );
			selectors.isEditedPostNew.mockReturnValue( true );

			// TODO: Publish autosave
			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should set auto-draft to draft before save', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( true );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( editPost( { status: 'draft' } ) );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
		} );

		it( 'should return update action for saveable, dirty draft', () => {
			selectors.isEditedPostSaveable.mockReturnValue( true );
			selectors.isEditedPostDirty.mockReturnValue( true );
			selectors.isCurrentPostPublished.mockReturnValue( false );
			selectors.isEditedPostNew.mockReturnValue( false );

			handler( {}, store );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( savePost() );
		} );
	} );

	describe( '.SETUP_EDITOR', () => {
		const handler = effects.SETUP_EDITOR;

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should return post reset action', () => {
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '',
				},
				status: 'draft',
			};

			const result = handler( { post } );

			expect( result ).toEqual( [
				resetPost( post ),
			] );
		} );

		it( 'should return block reset with non-empty content', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '<!-- wp:core/test-block -->Saved<!-- /wp:core/test-block -->',
				},
				status: 'draft',
			};

			const result = handler( { post } );

			expect( result ).toHaveLength( 2 );
			expect( result ).toContainEqual( resetPost( post ) );
			expect( result.some( ( { blocks } ) => {
				return blocks && blocks[ 0 ].name === 'core/test-block';
			} ) ).toBe( true );
		} );

		it( 'should return post setup action only if auto-draft', () => {
			const post = {
				id: 1,
				title: {
					raw: 'A History of Pork',
				},
				content: {
					raw: '',
				},
				status: 'auto-draft',
			};

			const result = handler( { post } );

			expect( result ).toEqual( [
				resetPost( post ),
				setupNewPost( { title: 'A History of Pork' } ),
			] );
		} );
	} );

	describe( '.ATTACH_BLOCK', () => {
		const handler = effects.ATTACH_BLOCK;

		const state = {};
		const dispatch = jest.fn();
		const store = { getState: () => state, dispatch };

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should convert a reusable block into a static block', () => {
			registerBlockType( 'core/test-block', {
				title: 'Test block',
				category: 'common',
				save: () => null,
				attributes: {
					name: { type: 'string' },
				},
			} );

			const oldBlock = {
				uid: 'ddb5956d-0f08-4f67-bc79-6bfc2134895b',
				name: 'core/reusable-block',
				attributes: {
					ref: 'cb2065b9-67a4-466c-8cd6-60de0526b02b',
				},
			};
			const reusableBlock = {
				id: 'cb2065b9-67a4-466c-8cd6-60de0526b02b',
				name: 'Cool reusable block',
				type: 'core/test-block',
				attributes: {
					name: 'Big Bird',
				},
			};

			selectors.getBlock.mockReturnValue( oldBlock );
			selectors.getReusableBlock.mockReturnValue( reusableBlock );
			uuid.mockReturnValue( '4fbd3373-d4e0-454e-97a0-08bfeb8a1cea' );
			handler( attachBlock( oldBlock.uid ), store );

			expect( selectors.getBlock ).toHaveBeenCalledWith( state, oldBlock.uid );
			expect( selectors.getReusableBlock ).toHaveBeenCalledWith( state, reusableBlock.id );
			expect( dispatch ).toHaveBeenCalledWith(
				replaceBlocks(
					[ oldBlock.uid ],
					[ createBlock( reusableBlock.type, reusableBlock.attributes ) ]
				)
			);
		} );
	} );

	describe( '.DETACH_BLOCK', () => {
		const handler = effects.DETACH_BLOCK;

		const state = {};
		const dispatch = jest.fn();
		const store = { getState: () => state, dispatch };

		afterEach( () => {
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'should convert a static block into a reusable block', () => {
			registerBlockType( 'core/reusable-block', {
				title: 'Reusable Block',
				category: 'common',
				save: () => null,
				attributes: {
					ref: { type: 'string' },
				},
			} );

			const oldBlock = {
				ref: 'cb2065b9-67a4-466c-8cd6-60de0526b02b',
				name: 'core/test-block',
				isValid: true,
				attributes: {
					name: 'Big Bird',
				},
			};
			const reusableBlockId = '4fbd3373-d4e0-454e-97a0-08bfeb8a1cea';

			selectors.getBlock.mockReturnValue( oldBlock );
			uuid.mockReturnValue( reusableBlockId );
			handler( detachBlock( oldBlock.uid ), store );

			expect( selectors.getBlock ).toHaveBeenCalledWith( state, oldBlock.uid );
			expect( dispatch ).toHaveBeenCalledWith(
				addReusableBlock( {
					id: reusableBlockId,
					name: '',
					type: oldBlock.name,
					attributes: oldBlock.attributes,
				} )
			);
			expect( dispatch ).toHaveBeenCalledWith( saveReusableBlock( reusableBlockId ) );
			expect( dispatch ).toHaveBeenCalledWith(
				replaceBlocks(
					[ oldBlock.uid ],
					[ createBlock( 'core/reusable-block', { ref: reusableBlockId } ) ]
				)
			);
		} );
	} );
} );
