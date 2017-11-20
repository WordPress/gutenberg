/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';
import moment from 'moment';
import { values, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import reducer, {
	replaceBlocks,
	hasEditorUndo,
	hasEditorRedo,
	getPostEdits,
	isEditedPostDirty,
	isCleanNewPost,
	getEditedPostTitle,
	getEditedPostExcerpt,
	getEditedPostVisibility,
	isEditedPostPublishable,
	isEditedPostSaveable,
	isEditedPostBeingScheduled,
	getBlock,
	getBlocks,
	getBlockCount,
	getBlockUids,
	getBlockIndex,
	isFirstBlock,
	isLastBlock,
	getPreviousBlock,
	getNextBlock,
	getEditedPostContent,
	getSuggestedPostFormat,
} from '../editor';
import { getDirtyMetaBoxes } from '../meta-boxes';

describe( 'editor', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: ( props ) => props.attributes.text,
			edit: noop,
			category: 'common',
			title: 'test block',
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	describe( 'reducer', () => {
		it( 'should return history (empty edits, blocksByUid, blockOrder), dirty flag by default', () => {
			const state = reducer( undefined, {} );

			expect( state.past ).toEqual( [] );
			expect( state.future ).toEqual( [] );
			expect( state.present.edits ).toEqual( {} );
			expect( state.present.blocksByUid ).toEqual( {} );
			expect( state.present.blockOrder ).toEqual( [] );
			expect( state.isDirty ).toBe( false );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = reducer( undefined, {} );
			const state = reducer( original, {
				type: 'RESET_BLOCKS',
				blocks: [ { uid: 'bananas' } ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'bananas' );
			expect( state.present.blockOrder ).toEqual( [ 'bananas' ] );
		} );

		it( 'should insert block', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'ribs',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 2 );
			expect( values( state.present.blocksByUid )[ 1 ].uid ).toBe( 'ribs' );
			expect( state.present.blockOrder ).toEqual( [ 'chicken', 'ribs' ] );
		} );

		it( 'should replace the block', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 1 );
			expect( values( state.present.blocksByUid )[ 0 ].name ).toBe( 'core/freeform' );
			expect( values( state.present.blocksByUid )[ 0 ].uid ).toBe( 'wings' );
			expect( state.present.blockOrder ).toEqual( [ 'wings' ] );
		} );

		it( 'should update the block', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
					isValid: false,
				} ],
			} );
			const state = reducer( deepFreeze( original ), {
				type: 'UPDATE_BLOCK',
				uid: 'chicken',
				updates: {
					attributes: { content: 'ribs' },
					isValid: true,
				},
			} );

			expect( state.present.blocksByUid.chicken ).toEqual( {
				uid: 'chicken',
				name: 'core/test-block',
				attributes: { content: 'ribs' },
				isValid: true,
			} );
		} );

		it( 'should move the block up', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move multiple blocks up', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'ribs', 'veggies' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'veggies', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_UP',
				uids: [ 'chicken' ],
			} );

			expect( state.present.blockOrder ).toBe( original.present.blockOrder );
		} );

		it( 'should move the block down', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'ribs', 'chicken' ] );
		} );

		it( 'should move multiple blocks down', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'chicken', 'ribs' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'veggies', 'chicken', 'ribs' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'MOVE_BLOCKS_DOWN',
				uids: [ 'ribs' ],
			} );

			expect( state.present.blockOrder ).toBe( original.present.blockOrder );
		} );

		it( 'should remove the block', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'ribs' ] );
			expect( state.present.blocksByUid ).toEqual( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should remove multiple blocks', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'chicken',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'veggies',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );
			const state = reducer( original, {
				type: 'REMOVE_BLOCKS',
				uids: [ 'chicken', 'veggies' ],
			} );

			expect( state.present.blockOrder ).toEqual( [ 'ribs' ] );
			expect( state.present.blocksByUid ).toEqual( {
				ribs: {
					uid: 'ribs',
					name: 'core/test-block',
					attributes: {},
				},
			} );
		} );

		it( 'should insert at the specified position', () => {
			const original = reducer( undefined, {
				type: 'RESET_BLOCKS',
				blocks: [ {
					uid: 'kumquat',
					name: 'core/test-block',
					attributes: {},
				}, {
					uid: 'loquat',
					name: 'core/test-block',
					attributes: {},
				} ],
			} );

			const state = reducer( original, {
				type: 'INSERT_BLOCKS',
				position: 1,
				blocks: [ {
					uid: 'persimmon',
					name: 'core/freeform',
				} ],
			} );

			expect( Object.keys( state.present.blocksByUid ) ).toHaveLength( 3 );
			expect( state.present.blockOrder ).toEqual( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );

		describe( 'edits()', () => {
			it( 'should save newly edited properties', () => {
				const original = reducer( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = reducer( original, {
					type: 'EDIT_POST',
					edits: {
						tags: [ 1 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'post title',
					tags: [ 1 ],
				} );
			} );

			it( 'should return same reference if no changed properties', () => {
				const original = reducer( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = reducer( original, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
					},
				} );

				expect( state.present.edits ).toBe( original.present.edits );
			} );

			it( 'should save modified properties', () => {
				const original = reducer( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
						tags: [ 1 ],
					},
				} );

				const state = reducer( original, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						tags: [ 2 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'modified title',
					tags: [ 2 ],
				} );
			} );

			it( 'should save initial post state', () => {
				const state = reducer( undefined, {
					type: 'SETUP_NEW_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'post title',
				} );
			} );

			it( 'should omit content when resetting', () => {
				// Use case: When editing in Text mode, we defer to content on
				// the property, but we reset blocks by parse when switching
				// back to Visual mode.
				const original = deepFreeze( reducer( undefined, {} ) );
				let state = reducer( original, {
					type: 'EDIT_POST',
					edits: {
						content: 'bananas',
					},
				} );

				expect( state.present.edits ).toHaveProperty( 'content' );

				state = reducer( original, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						name: 'core/test-block',
						attributes: {},
					}, {
						uid: 'loquat',
						name: 'core/test-block',
						attributes: {},
					} ],
				} );

				expect( state.present.edits ).not.toHaveProperty( 'content' );
			} );
		} );

		describe( 'blocksByUid', () => {
			it( 'should return with attribute block updates', () => {
				const original = deepFreeze( reducer( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {},
					} ],
				} ) );
				const state = reducer( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid.kumquat.attributes.updated ).toBe( true );
			} );

			it( 'should accumulate attribute block updates', () => {
				const original = deepFreeze( reducer( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {
							updated: true,
						},
					} ],
				} ) );
				const state = reducer( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						moreUpdated: true,
					},
				} );

				expect( state.present.blocksByUid.kumquat.attributes ).toEqual( {
					updated: true,
					moreUpdated: true,
				} );
			} );

			it( 'should ignore updates to non-existant block', () => {
				const original = deepFreeze( reducer( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [],
				} ) );
				const state = reducer( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid ).toBe( original.present.blocksByUid );
			} );

			it( 'should return with same reference if no changes in updates', () => {
				const original = deepFreeze( reducer( undefined, {
					type: 'RESET_BLOCKS',
					blocks: [ {
						uid: 'kumquat',
						attributes: {
							updated: true,
						},
					} ],
				} ) );
				const state = reducer( original, {
					type: 'UPDATE_BLOCK_ATTRIBUTES',
					uid: 'kumquat',
					attributes: {
						updated: true,
					},
				} );

				expect( state.present.blocksByUid ).toBe( state.present.blocksByUid );
			} );
		} );
	} );

	describe( 'action creators', () => {
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
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			getBlock.clear();
			getBlocks.clear();
			getEditedPostContent.clear();
			getDirtyMetaBoxes.clear();
		} );

		describe( 'getPostEdits', () => {
			it( 'should return the post edits', () => {
				const state = {
					editor: {
						present: {
							edits: { title: 'terga' },
						},
					},
				};

				expect( getPostEdits( state ) ).toEqual( { title: 'terga' } );
			} );
		} );

		describe( 'isEditedPostDirty', () => {
			const metaBoxes = {
				normal: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
				},
				side: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
				},
			};
			// Those dirty dang meta boxes.
			const dirtyMetaBoxes = {
				normal: {
					isActive: true,
					isDirty: true,
					isUpdating: false,
				},
				side: {
					isActive: false,
					isDirty: false,
					isUpdating: false,
				},
			};

			it( 'should return true when post saved state dirty', () => {
				const state = {
					editor: {
						isDirty: true,
					},
					metaBoxes,
				};

				expect( isEditedPostDirty( state ) ).toBe( true );
			} );

			it( 'should return false when post saved state not dirty', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					metaBoxes,
				};

				expect( isEditedPostDirty( state ) ).toBe( false );
			} );

			it( 'should return true when post saved state not dirty, but meta box state has changed.', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					metaBoxes: dirtyMetaBoxes,
				};

				expect( isEditedPostDirty( state ) ).toBe( true );
			} );
		} );

		describe( 'isCleanNewPost', () => {
			const metaBoxes = { isDirty: false, isUpdating: false };

			it( 'should return true when the post is not dirty and has not been saved before', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						id: 1,
						status: 'auto-draft',
					},
					metaBoxes,
				};

				expect( isCleanNewPost( state ) ).toBe( true );
			} );

			it( 'should return false when the post is not dirty but the post has been saved', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						id: 1,
						status: 'draft',
					},
					metaBoxes,
				};

				expect( isCleanNewPost( state ) ).toBe( false );
			} );

			it( 'should return false when the post is dirty but the post has not been saved', () => {
				const state = {
					editor: {
						isDirty: true,
					},
					currentPost: {
						id: 1,
						status: 'auto-draft',
					},
					metaBoxes,
				};

				expect( isCleanNewPost( state ) ).toBe( false );
			} );
		} );

		describe( 'isEditedPostPublishable', () => {
			const metaBoxes = { isDirty: false, isUpdating: false };

			it( 'should return true for pending posts', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						status: 'pending',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( true );
			} );

			it( 'should return true for draft posts', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						status: 'draft',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( true );
			} );

			it( 'should return false for published posts', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						status: 'publish',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( false );
			} );

			it( 'should return true for published, dirty posts', () => {
				const state = {
					editor: {
						isDirty: true,
					},
					currentPost: {
						status: 'publish',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( true );
			} );

			it( 'should return false for private posts', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						status: 'private',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( false );
			} );

			it( 'should return false for scheduled posts', () => {
				const state = {
					editor: {
						isDirty: false,
					},
					currentPost: {
						status: 'future',
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( false );
			} );

			it( 'should return true for dirty posts with usable title', () => {
				const state = {
					currentPost: {
						status: 'private',
					},
					editor: {
						isDirty: true,
					},
					metaBoxes,
				};

				expect( isEditedPostPublishable( state ) ).toBe( true );
			} );
		} );

		describe( 'isEditedPostSaveable', () => {
			it( 'should return false if the post has no title, excerpt, content', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {},
							blockOrder: [],
							edits: {},
						},
					},
					currentPost: {},
				};

				expect( isEditedPostSaveable( state ) ).toBe( false );
			} );

			it( 'should return true if the post has a title', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {},
							blockOrder: [],
							edits: {},
						},
					},
					currentPost: {
						title: 'sassel',
					},
				};

				expect( isEditedPostSaveable( state ) ).toBe( true );
			} );

			it( 'should return true if the post has an excerpt', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {},
							blockOrder: [],
							edits: {},
						},
					},
					currentPost: {
						excerpt: 'sassel',
					},
				};

				expect( isEditedPostSaveable( state ) ).toBe( true );
			} );

			it( 'should return true if the post has content', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								123: {
									uid: 123,
									name: 'core/test-block',
									attributes: {
										text: '',
									},
								},
							},
							blockOrder: [ 123 ],
							edits: {},
						},
					},
					currentPost: {},
				};

				expect( isEditedPostSaveable( state ) ).toBe( true );
			} );
		} );

		describe( 'getEditedPostTitle', () => {
			it( 'should return the post saved title if the title is not edited', () => {
				const state = {
					currentPost: {
						title: 'sassel',
					},
					editor: {
						present: {
							edits: { status: 'private' },
						},
					},
				};

				expect( getEditedPostTitle( state ) ).toBe( 'sassel' );
			} );

			it( 'should return the edited title', () => {
				const state = {
					currentPost: {
						title: 'sassel',
					},
					editor: {
						present: {
							edits: { title: 'youcha' },
						},
					},
				};

				expect( getEditedPostTitle( state ) ).toBe( 'youcha' );
			} );
		} );

		describe( 'isEditedPostBeingScheduled', () => {
			it( 'should return true for posts with a future date', () => {
				const state = {
					editor: {
						present: {
							edits: { date: moment().add( 7, 'days' ).format( '' ) },
						},
					},
				};

				expect( isEditedPostBeingScheduled( state ) ).toBe( true );
			} );

			it( 'should return false for posts with an old date', () => {
				const state = {
					editor: {
						present: {
							edits: { date: '2016-05-30T17:21:39' },
						},
					},
				};

				expect( isEditedPostBeingScheduled( state ) ).toBe( false );
			} );
		} );

		describe( 'getBlock', () => {
			it( 'should return the block', () => {
				const state = {
					currentPost: {},
					editor: {
						present: {
							blocksByUid: {
								123: { uid: 123, name: 'core/paragraph' },
							},
							edits: {},
						},
					},
				};

				expect( getBlock( state, 123 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
			} );

			it( 'should return null if the block is not present in state', () => {
				const state = {
					currentPost: {},
					editor: {
						present: {
							blocksByUid: {},
							edits: {},
						},
					},
				};

				expect( getBlock( state, 123 ) ).toBe( null );
			} );

			it( 'should merge meta attributes for the block', () => {
				registerBlockType( 'core/meta-block', {
					save: ( props ) => props.attributes.text,
					category: 'common',
					title: 'test block',
					attributes: {
						foo: {
							type: 'string',
							source: 'meta',
							meta: 'foo',
						},
					},
				} );

				const state = {
					currentPost: {
						meta: {
							foo: 'bar',
						},
					},
					editor: {
						present: {
							blocksByUid: {
								123: { uid: 123, name: 'core/meta-block' },
							},
							edits: {},
						},
					},
				};

				expect( getBlock( state, 123 ) ).toEqual( {
					uid: 123,
					name: 'core/meta-block',
					attributes: {
						foo: 'bar',
					},
				} );
			} );
		} );

		describe( 'getEditedPostExcerpt', () => {
			it( 'should return the post saved excerpt if the excerpt is not edited', () => {
				const state = {
					currentPost: {
						excerpt: 'sassel',
					},
					editor: {
						present: {
							edits: { status: 'private' },
						},
					},
				};

				expect( getEditedPostExcerpt( state ) ).toBe( 'sassel' );
			} );

			it( 'should return the edited excerpt', () => {
				const state = {
					currentPost: {
						excerpt: 'sassel',
					},
					editor: {
						present: {
							edits: { excerpt: 'youcha' },
						},
					},
				};

				expect( getEditedPostExcerpt( state ) ).toBe( 'youcha' );
			} );
		} );

		describe( 'getEditedPostVisibility', () => {
			it( 'should return public by default', () => {
				const state = {
					currentPost: {
						status: 'draft',
					},
					editor: {
						present: {
							edits: {},
						},
					},
				};

				expect( getEditedPostVisibility( state ) ).toBe( 'public' );
			} );

			it( 'should return private for private posts', () => {
				const state = {
					currentPost: {
						status: 'private',
					},
					editor: {
						present: {
							edits: {},
						},
					},
				};

				expect( getEditedPostVisibility( state ) ).toBe( 'private' );
			} );

			it( 'should return private for password for password protected posts', () => {
				const state = {
					currentPost: {
						status: 'draft',
						password: 'chicken',
					},
					editor: {
						present: {
							edits: {},
						},
					},
				};

				expect( getEditedPostVisibility( state ) ).toBe( 'password' );
			} );

			it( 'should use the edited status and password if edits present', () => {
				const state = {
					currentPost: {
						status: 'draft',
						password: 'chicken',
					},
					editor: {
						present: {
							edits: {
								status: 'private',
								password: null,
							},
						},
					},
				};

				expect( getEditedPostVisibility( state ) ).toBe( 'private' );
			} );
		} );

		describe( 'getBlocks', () => {
			it( 'should return the ordered blocks', () => {
				const state = {
					currentPost: {},
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
							edits: {},
						},
					},
				};

				expect( getBlocks( state ) ).toEqual( [
					{ uid: 123, name: 'core/paragraph' },
					{ uid: 23, name: 'core/heading' },
				] );
			} );
		} );

		describe( 'getBlockCount', () => {
			it( 'should return the number of blocks in the post', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getBlockCount( state ) ).toBe( 2 );
			} );
		} );

		describe( 'getBlockUids', () => {
			it( 'should return the ordered block UIDs', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getBlockUids( state ) ).toEqual( [ 123, 23 ] );
			} );
		} );

		describe( 'getBlockIndex', () => {
			it( 'should return the block order', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getBlockIndex( state, 23 ) ).toBe( 1 );
			} );
		} );

		describe( 'isFirstBlock', () => {
			it( 'should return true when the block is first', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( isFirstBlock( state, 123 ) ).toBe( true );
			} );

			it( 'should return false when the block is not first', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( isFirstBlock( state, 23 ) ).toBe( false );
			} );
		} );

		describe( 'isLastBlock', () => {
			it( 'should return true when the block is last', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( isLastBlock( state, 23 ) ).toBe( true );
			} );

			it( 'should return false when the block is not last', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( isLastBlock( state, 123 ) ).toBe( false );
			} );
		} );

		describe( 'getPreviousBlock', () => {
			it( 'should return the previous block', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getPreviousBlock( state, 23 ) ).toEqual( { uid: 123, name: 'core/paragraph' } );
			} );

			it( 'should return null for the first block', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getPreviousBlock( state, 123 ) ).toBeNull();
			} );
		} );

		describe( 'getNextBlock', () => {
			it( 'should return the following block', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getNextBlock( state, 123 ) ).toEqual( { uid: 23, name: 'core/heading' } );
			} );

			it( 'should return null for the last block', () => {
				const state = {
					editor: {
						present: {
							blocksByUid: {
								23: { uid: 23, name: 'core/heading' },
								123: { uid: 123, name: 'core/paragraph' },
							},
							blockOrder: [ 123, 23 ],
						},
					},
				};

				expect( getNextBlock( state, 23 ) ).toBeNull();
			} );
		} );

		describe( 'getSuggestedPostFormat', () => {
			it( 'returns null if cannot be determined', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [],
							blocksByUid: {},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBeNull();
			} );

			it( 'returns null if there is more than one block in the post', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123, 456 ],
							blocksByUid: {
								123: { uid: 123, name: 'core/image' },
								456: { uid: 456, name: 'core/quote' },
							},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBeNull();
			} );

			it( 'returns Image if the first block is of type `core/image`', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 123 ],
							blocksByUid: {
								123: { uid: 123, name: 'core/image' },
							},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBe( 'image' );
			} );

			it( 'returns Quote if the first block is of type `core/quote`', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 456 ],
							blocksByUid: {
								456: { uid: 456, name: 'core/quote' },
							},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
			} );

			it( 'returns Video if the first block is of type `core-embed/youtube`', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 567 ],
							blocksByUid: {
								567: { uid: 567, name: 'core-embed/youtube' },
							},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBe( 'video' );
			} );

			it( 'returns Quote if the first block is of type `core/quote` and second is of type `core/paragraph`', () => {
				const state = {
					editor: {
						present: {
							blockOrder: [ 456, 789 ],
							blocksByUid: {
								456: { uid: 456, name: 'core/quote' },
								789: { uid: 789, name: 'core/paragraph' },
							},
						},
					},
				};

				expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
			} );
		} );

		describe( 'hasEditorUndo', () => {
			it( 'should return true when the past history is not empty', () => {
				const state = {
					editor: {
						past: [
							{},
						],
					},
				};

				expect( hasEditorUndo( state ) ).toBe( true );
			} );

			it( 'should return false when the past history is empty', () => {
				const state = {
					editor: {
						past: [],
					},
				};

				expect( hasEditorUndo( state ) ).toBe( false );
			} );
		} );

		describe( 'hasEditorRedo', () => {
			it( 'should return true when the future history is not empty', () => {
				const state = {
					editor: {
						future: [
							{},
						],
					},
				};

				expect( hasEditorRedo( state ) ).toBe( true );
			} );

			it( 'should return false when the future history is empty', () => {
				const state = {
					editor: {
						future: [],
					},
				};

				expect( hasEditorRedo( state ) ).toBe( false );
			} );
		} );
	} );
} );
