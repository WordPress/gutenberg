/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType, registerBlockType, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { mergeBlocks, focusBlock, replaceBlocks, editPost, savePost } from '../actions';
import effects from '../effects';
import * as selectors from '../selectors';

jest.mock( '../selectors' );

describe( 'effects', () => {
	const defaultBlockSettings = { save: noop, category: 'common' };

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
			} );
			registerBlockType( 'core/test-block-2', {
				attributes: {
					content: {
						type: 'string',
					},
				},
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
				category: 'common',
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
} );
