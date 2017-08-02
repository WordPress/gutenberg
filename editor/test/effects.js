/**
 * External dependencies
 */
import { noop } from 'lodash';

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
} from '../actions';
import effects from '../effects';
import * as selectors from '../selectors';

jest.mock( '../selectors' );

describe( 'effects', () => {
	const defaultBlockType = { name: 'core/test-block', save: () => 'Saved', category: 'common' };

	beforeEach( () => jest.resetAllMocks() );

	describe( '.MERGE_BLOCKS', () => {
		const handler = effects.MERGE_BLOCKS;

		it( 'should only focus the blockA if the blockA has no merge function', () => {
			const blockA = {
				uid: 'chicken',
				name: 'core/test-block',
			};
			const blockB = {
				uid: 'ribs',
				name: 'core/test-block',
			};
			const state = {
				editorSettings: {
					blockTypes: [ defaultBlockType ],
				},
			};
			const dispatch = jest.fn();
			const getState = () => state;
			selectors.getEditorSettings.mockReturnValue( state.editorSettings );
			handler( mergeBlocks( blockA, blockB ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken' ) );
		} );

		it( 'should merge the blocks if blocks of the same type', () => {
			const testBlockType = {
				name: 'core/test-block',
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
			};
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
			const state = {
				editorSettings: {
					blockTypes: [ testBlockType ],
				},
			};
			const getState = () => state;
			selectors.getEditorSettings.mockReturnValue( state.editorSettings );
			handler( mergeBlocks( blockA, blockB ), { dispatch, getState } );

			expect( dispatch ).toHaveBeenCalledTimes( 2 );
			expect( dispatch ).toHaveBeenCalledWith( focusBlock( 'chicken', { offset: -1 } ) );
			expect( dispatch ).toHaveBeenCalledWith( replaceBlocks( [ 'chicken', 'ribs' ], [ {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'chicken ribs' },
			} ] ) );
		} );

		it( 'should not merge the blocks have different types without transformation', () => {
			const testBlockType = {
				name: 'core/test-block',
				merge( attributes, attributesToMerge ) {
					return {
						content: attributes.content + ' ' + attributesToMerge.content,
					};
				},
				save: noop,
				category: 'common',
			};
			const testBlockType2 = {
				...defaultBlockType,
				name: 'core/test-block-2',
			};
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
			const state = {
				editorSettings: {
					blockTypes: [ testBlockType, testBlockType2 ],
				},
			};
			const getState = () => state;
			selectors.getEditorSettings.mockReturnValue( state.editorSettings );
			handler( mergeBlocks( blockA, blockB ), { dispatch, getState } );

			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should transform and merge the blocks', () => {
			const testBlockType = {
				name: 'core/test-block',
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
			};
			const testBlockType2 = {
				name: 'core/test-block-2',
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
							return {
								name: 'core/test-block',
								attributes: {
									content: content2,
								},
							};
						},
					} ],
				},
				save: noop,
				category: 'common',
			};
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
			const state = {
				editorSettings: {
					blockTypes: [ testBlockType, testBlockType2 ],
				},
			};
			const getState = () => state;
			selectors.getEditorSettings.mockReturnValue( state.editorSettings );
			handler( mergeBlocks( blockA, blockB ), { dispatch, getState } );

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

	describe( '.SET_INITIAL_POST', () => {
		const handler = effects.SET_INITIAL_POST;
		const getState = () => ( {
			editorSettings: {
				blockTypes: [ defaultBlockType ],
			},
		} );

		it( 'should return post reset action', () => {
			selectors.getEditorSettings.mockReturnValue( getState().editorSettings );
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

			const result = handler( { post }, { getState } );

			expect( result ).toEqual( [
				resetPost( post ),
			] );
		} );

		it( 'should return block reset with non-empty content', () => {
			selectors.getEditorSettings.mockReturnValue( getState().editorSettings );
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

			const result = handler( { post }, { getState } );

			expect( result ).toHaveLength( 2 );
			expect( result ).toContainEqual( resetPost( post ) );
			expect( result.some( ( { blocks } ) => {
				return blocks && blocks[ 0 ].name === 'core/test-block';
			} ) ).toBe( true );
		} );

		it( 'should return post setup action only if auto-draft', () => {
			selectors.getEditorSettings.mockReturnValue( getState().editorSettings );
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

			const result = handler( { post }, { getState } );

			expect( result ).toEqual( [
				resetPost( post ),
				setupNewPost( { title: 'A History of Pork' } ),
			] );
		} );
	} );
} );
