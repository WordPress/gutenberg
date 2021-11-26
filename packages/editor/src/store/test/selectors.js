/**
 * External dependencies
 */
import { filter, without } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
	getDefaultBlockName,
	setDefaultBlockName,
	setFreeformContentHandlerName,
	getBlockTypes,
} from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';
import { layout, footer, header } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import * as _selectors from '../selectors';
import { PREFERENCES_DEFAULTS } from '../defaults';

const selectors = { ..._selectors };
const selectorNames = Object.keys( selectors );
selectorNames.forEach( ( name ) => {
	selectors[ name ] = ( state, ...args ) => {
		const select = () => ( {
			getRawEntityRecord() {
				return state.currentPost;
			},

			__experimentalGetDirtyEntityRecords() {
				return (
					state.__experimentalGetDirtyEntityRecords &&
					state.__experimentalGetDirtyEntityRecords()
				);
			},

			__experimentalGetEntitiesBeingSaved() {
				return (
					state.__experimentalGetEntitiesBeingSaved &&
					state.__experimentalGetEntitiesBeingSaved()
				);
			},

			getEntityRecordEdits() {
				const present = state.editor && state.editor.present;
				let edits = present && present.edits;

				if ( state.initialEdits ) {
					edits = {
						...state.initialEdits,
						...edits,
					};
				}

				const { value: blocks, isDirty } =
					( present && present.blocks ) || {};
				if ( blocks && isDirty !== false ) {
					edits = {
						...edits,
						blocks,
					};
				}

				return edits;
			},

			hasEditsForEntityRecord() {
				return Object.keys( this.getEntityRecordEdits() ).length > 0;
			},

			getEditedEntityRecord() {
				return {
					...this.getRawEntityRecord(),
					...this.getEntityRecordEdits(),
				};
			},

			isSavingEntityRecord() {
				return state.saving && state.saving.requesting;
			},

			getLastEntitySaveError() {
				const saving = state.saving;
				const successful = saving && saving.successful;
				const error = saving && saving.error;
				return successful === undefined ? error : ! successful;
			},

			hasUndo() {
				return Boolean(
					state.editor &&
						state.editor.past &&
						state.editor.past.length
				);
			},

			hasRedo() {
				return Boolean(
					state.editor &&
						state.editor.future &&
						state.editor.future.length
				);
			},

			getCurrentUser() {
				return state.getCurrentUser && state.getCurrentUser();
			},

			hasFetchedAutosaves() {
				return state.hasFetchedAutosaves && state.hasFetchedAutosaves();
			},

			getAutosave() {
				return state.getAutosave && state.getAutosave();
			},

			getPostType() {
				const postTypeLabel = {
					post: 'Post',
					page: 'Page',
				}[ state.postType ];

				return {
					labels: {
						singular_name: postTypeLabel,
					},
				};
			},
		} );

		selectorNames.forEach( ( otherName ) => {
			if ( _selectors[ otherName ].isRegistrySelector ) {
				_selectors[ otherName ].registry = { select };
			}
		} );

		return _selectors[ name ]( state, ...args );
	};
	selectors[ name ].isRegistrySelector =
		_selectors[ name ].isRegistrySelector;
	if ( selectors[ name ].isRegistrySelector ) {
		selectors[ name ].registry = {
			select: () => _selectors[ name ].registry.select(),
		};
	}
} );
const {
	hasEditorUndo,
	hasEditorRedo,
	isEditedPostNew,
	hasChangedContent,
	isEditedPostDirty,
	hasNonPostEntityChanges,
	isCleanNewPost,
	getCurrentPost,
	getCurrentPostId,
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
	getCurrentPostType,
	getPostEdits,
	getEditedPostVisibility,
	isCurrentPostPending,
	isCurrentPostPublished,
	isCurrentPostScheduled,
	isEditedPostPublishable,
	isEditedPostSaveable,
	isEditedPostAutosaveable,
	isEditedPostEmpty,
	isEditedPostBeingScheduled,
	isEditedPostDateFloating,
	getCurrentPostAttribute,
	getEditedPostAttribute,
	isSavingPost,
	isSavingNonPostEntityChanges,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	getSuggestedPostFormat,
	getEditedPostContent,
	isPublishSidebarEnabled,
	isPermalinkEditable,
	getPermalink,
	getPermalinkParts,
	getEditedPostSlug,
	isPostSavingLocked,
	isPostAutosavingLocked,
	canUserUseUnfilteredHTML,
	getPostTypeLabel,
	__experimentalGetDefaultTemplateType,
	__experimentalGetDefaultTemplateTypes,
	__experimentalGetTemplateInfo,
	__experimentalGetDefaultTemplatePartAreas,
} = selectors;

const defaultTemplateTypes = [
	{
		title: 'Default (Index)',
		description: 'Main template',
		slug: 'index',
	},
	{
		title: '404 (Not Found)',
		description: 'Applied when content cannot be found',
		slug: '404',
	},
];

const defaultTemplatePartAreas = [
	{
		area: 'header',
		label: 'Header',
		description: 'Some description of a header',
		icon: 'header',
	},
	{
		area: 'footer',
		label: 'Footer',
		description: 'Some description of a footer',
		icon: 'footer',
	},
];

describe( 'selectors', () => {
	let cachedSelectors;

	beforeAll( () => {
		cachedSelectors = filter( selectors, ( selector ) => selector.clear );
	} );

	beforeEach( () => {
		registerBlockType( 'core/block', {
			save: () => null,
			category: 'reusable',
			title: 'Reusable Block Stub',
			supports: {
				inserter: false,
			},
		} );

		registerBlockType( 'core/test-block-a', {
			save: ( props ) => props.attributes.text,
			category: 'design',
			title: 'Test Block A',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-b', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block B',
			icon: 'test',
			keywords: [ 'testing' ],
			supports: {
				multiple: false,
			},
		} );

		registerBlockType( 'core/test-block-c', {
			save: ( props ) => props.attributes.text,
			category: 'text',
			title: 'Test Block C',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/test-block-b' ],
		} );

		registerBlockType( 'core/test-freeform', {
			save: ( props ) => <RawHTML>{ props.attributes.content }</RawHTML>,
			category: 'text',
			title: 'Test Freeform Content Handler',
			icon: 'test',
			supports: {
				className: false,
			},
			attributes: {
				content: {
					type: 'string',
				},
			},
		} );

		registerBlockType( 'core/test-default', {
			category: 'text',
			title: 'default',
			attributes: {
				modified: {
					type: 'boolean',
					default: false,
				},
			},
			save: () => null,
		} );

		setFreeformContentHandlerName( 'core/test-freeform' );
		setDefaultBlockName( 'core/test-default' );

		cachedSelectors.forEach( ( { clear } ) => clear() );
	} );

	afterEach( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/test-block-a' );
		unregisterBlockType( 'core/test-block-b' );
		unregisterBlockType( 'core/test-block-c' );
		unregisterBlockType( 'core/test-freeform' );
		unregisterBlockType( 'core/test-default' );

		setFreeformContentHandlerName( undefined );
		setDefaultBlockName( undefined );
	} );

	describe( 'hasEditorUndo', () => {
		it( 'should return true when the past history is not empty', () => {
			const state = {
				editor: {
					past: [ {} ],
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
					future: [ {} ],
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

	describe( 'isEditedPostNew', () => {
		it( 'should return true when the post is new', () => {
			const state = {
				currentPost: {
					status: 'auto-draft',
				},
				editor: {
					present: {
						edits: {
							status: 'draft',
						},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostNew( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not new', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					present: {
						edits: {
							status: 'draft',
						},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostNew( state ) ).toBe( false );
		} );
	} );

	describe( 'hasChangedContent', () => {
		it( 'should return false if no dirty blocks nor content property edit', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
						},
						edits: {},
					},
				},
			};

			expect( hasChangedContent( state ) ).toBe( false );
		} );

		it( 'should return true if dirty blocks', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: true,
							value: [],
						},
						edits: {},
					},
				},
			};

			expect( hasChangedContent( state ) ).toBe( true );
		} );

		it( 'should return true if content property edit', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {
							content: 'text mode edited',
						},
					},
				},
			};

			expect( hasChangedContent( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		it( 'should return false when blocks state not dirty nor edits exist', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );

		it( 'should return true when blocks state dirty', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: true,
							value: [],
						},
						edits: {},
					},
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return true when edits exist', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {
							excerpt: 'hello world',
						},
					},
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );
	} );

	describe( 'hasNonPostEntityChanges', () => {
		it( 'should return true if there are changes to an arbitrary entity', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetDirtyEntityRecords() {
					return [
						{ kind: 'someKind', name: 'someName', key: 'someKey' },
					];
				},
			};
			expect( hasNonPostEntityChanges( state ) ).toBe( true );
		} );
		it( 'should return false if there are only changes for the current post', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetDirtyEntityRecords() {
					return [ { kind: 'postType', name: 'post', key: 1 } ];
				},
			};
			expect( hasNonPostEntityChanges( state ) ).toBe( false );
		} );
		it( 'should return true if there are changes to multiple posts', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetDirtyEntityRecords() {
					return [
						{ kind: 'postType', name: 'post', key: 1 },
						{ kind: 'postType', name: 'post', key: 2 },
					];
				},
			};
			expect( hasNonPostEntityChanges( state ) ).toBe( true );
		} );
		it( 'should return true if there are changes to multiple posts of different post types', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetDirtyEntityRecords() {
					return [
						{ kind: 'postType', name: 'post', key: 1 },
						{ kind: 'postType', name: 'wp_template', key: 1 },
					];
				},
			};
			expect( hasNonPostEntityChanges( state ) ).toBe( true );
		} );
	} );

	describe( 'isCleanNewPost', () => {
		it( 'should return true when the post is not dirty and has not been saved before', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not dirty but the post has been saved', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					id: 1,
					status: 'draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );

		it( 'should return false when the post is dirty but the post has not been saved', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: true,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );
	} );

	describe( 'getCurrentPost', () => {
		it( 'should return the current post', () => {
			const state = {
				currentPost: { id: 1 },
			};

			expect( getCurrentPost( state ) ).toEqual( { id: 1 } );
		} );
	} );

	describe( 'getCurrentPostId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				postId: null,
			};

			expect( getCurrentPostId( state ) ).toBeNull();
		} );

		it( 'should return the current post ID', () => {
			const state = {
				postId: 1,
			};

			expect( getCurrentPostId( state ) ).toBe( 1 );
		} );
	} );

	describe( 'getCurrentPostAttribute', () => {
		it( 'should return undefined for an attribute which does not exist', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostAttribute( state, 'foo' ) ).toBeUndefined();
		} );

		it( 'should return undefined for object prototype member', () => {
			const state = {
				currentPost: {},
			};

			expect(
				getCurrentPostAttribute( state, 'valueOf' )
			).toBeUndefined();
		} );

		it( 'should return the value of an attribute', () => {
			const state = {
				currentPost: {
					title: 'Hello World',
				},
			};

			expect( getCurrentPostAttribute( state, 'title' ) ).toBe(
				'Hello World'
			);
		} );
	} );

	describe( 'getEditedPostAttribute', () => {
		it( 'should return the current post’s slug if no edits have been made', () => {
			const state = {
				currentPost: { slug: 'post slug' },
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( getEditedPostAttribute( state, 'slug' ) ).toBe(
				'post slug'
			);
		} );

		it( 'should return the latest slug if edits have been made to the post', () => {
			const state = {
				currentPost: { slug: 'old slug' },
				editor: {
					present: {
						edits: {
							slug: 'new slug',
						},
					},
				},
				initialEdits: {},
			};

			expect( getEditedPostAttribute( state, 'slug' ) ).toBe(
				'new slug'
			);
		} );

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
				initialEdits: {},
			};

			expect( getEditedPostAttribute( state, 'title' ) ).toBe( 'sassel' );
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
				initialEdits: {},
			};

			expect( getEditedPostAttribute( state, 'title' ) ).toBe( 'youcha' );
		} );

		it( 'should return undefined for object prototype member', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect(
				getEditedPostAttribute( state, 'valueOf' )
			).toBeUndefined();
		} );

		it( 'should merge mergeable properties with current post value', () => {
			const state = {
				currentPost: {
					meta: {
						a: 1,
						b: 1,
					},
				},
				editor: {
					present: {
						edits: {
							meta: {
								b: 2,
							},
						},
					},
				},
				initialEdits: {},
			};

			expect( getEditedPostAttribute( state, 'meta' ) ).toEqual( {
				a: 1,
				b: 2,
			} );
		} );
	} );

	describe( 'getCurrentPostLastRevisionId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBeNull();
		} );

		it( 'should return the last revision ID', () => {
			const state = {
				currentPost: {
					_links: {
						'predecessor-version': [
							{
								id: 123,
							},
						],
					},
				},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBe( 123 );
		} );
	} );

	describe( 'getCurrentPostRevisionsCount', () => {
		it( 'should return 0 if the post has no revisions', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 0 );
		} );

		it( 'should return the number of revisions', () => {
			const state = {
				currentPost: {
					_links: {
						'version-history': [
							{
								count: 5,
							},
						],
					},
				},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 5 );
		} );
	} );

	describe( 'getCurrentPostType', () => {
		it( 'should return the post type', () => {
			const state = {
				postType: 'post',
			};

			expect( getCurrentPostType( state ) ).toBe( 'post' );
		} );
	} );

	describe( 'getPostEdits', () => {
		it( 'should return the post edits', () => {
			const state = {
				editor: {
					present: {
						edits: { title: 'terga' },
					},
				},
				initialEdits: {},
			};

			expect( getPostEdits( state ) ).toEqual( { title: 'terga' } );
		} );

		it( 'should return value from initial edits', () => {
			const state = {
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: { title: 'terga' },
			};

			expect( getPostEdits( state ) ).toEqual( { title: 'terga' } );
		} );

		it( 'should prefer value from edits over initial edits', () => {
			const state = {
				editor: {
					present: {
						edits: { title: 'werga' },
					},
				},
				initialEdits: { title: 'terga' },
			};

			expect( getPostEdits( state ) ).toEqual( { title: 'werga' } );
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
				initialEdits: {},
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
				initialEdits: {},
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
				initialEdits: {},
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
				initialEdits: {},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'private' );
		} );
	} );

	describe( 'isCurrentPostPending', () => {
		it( 'should return true for posts in pending state', () => {
			const state = {
				currentPost: {
					status: 'pending',
				},
			};

			expect( isCurrentPostPending( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isCurrentPostPending( state ) ).toBe( false );
		} );

		it( 'should return false if status is unknown', () => {
			const state = {
				currentPost: {},
			};

			expect( isCurrentPostPending( state ) ).toBe( false );
		} );
	} );

	describe( 'isCurrentPostPublished', () => {
		it( 'should return true for public posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return true for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( false );
		} );

		it( 'should return true for old scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );
	} );

	describe( 'isCurrentPostScheduled', () => {
		it( 'should return true for future scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2100-05-30T17:21:39',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( true );
		} );

		it( 'should return false for old scheduled posts that were already published', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );

		it( 'should return false for auto draft posts', () => {
			const state = {
				currentPost: {
					status: 'auto-draft',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );

		it( 'should return false if status is unknown', () => {
			const state = {
				currentPost: {},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostPublishable', () => {
		it( 'should return true for pending posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'pending',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return true for draft posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'publish',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for published, dirty posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: true,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'publish',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for private posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'private',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for scheduled posts', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							isDirty: false,
							value: [],
						},
						edits: {},
					},
				},
				currentPost: {
					status: 'future',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for dirty posts with usable title', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					present: {
						blocks: {
							isDirty: true,
							value: [],
						},
						edits: {},
					},
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );
	} );

	describe( 'isPostSavingLocked', () => {
		it( 'should return true if the post has postSavingLocks', () => {
			const state = {
				postSavingLock: { example: true },
				currentPost: {},
				saving: {},
			};

			expect( isPostSavingLocked( state ) ).toBe( true );
		} );

		it( 'should return false if the post has no postSavingLocks', () => {
			const state = {
				postSavingLock: {},
				currentPost: {},
				saving: {},
			};

			expect( isPostSavingLocked( state ) ).toBe( false );
		} );
	} );

	describe( 'isPostAutosavingLocked', () => {
		it( 'should return true if the post has postAutosavingLocks', () => {
			const state = {
				postAutosavingLock: { example: true },
				currentPost: {},
				saving: {},
			};

			expect( isPostAutosavingLocked( state ) ).toBe( true );
		} );

		it( 'should return false if the post has no postAutosavingLocks', () => {
			const state = {
				postAutosavingLock: {},
				currentPost: {},
				saving: {},
			};

			expect( isPostAutosavingLocked( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostSaveable', () => {
		it( 'should return false if the post has no title, excerpt, content', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return false if the post has a title but save already in progress', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {
					requesting: true,
				},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return true if the post has a title', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has an excerpt', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							byClientId: {},
							attributes: {},
							order: {},
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					excerpt: 'sassel',
				},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has content', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-block-a',
									isValid: true,
									attributes: {
										text: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return false if the post has no title, excerpt and empty classic block', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return true if the post has a title and empty classic block', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostAutosaveable', () => {
		it( 'should return false if existing autosaves have not yet been fetched', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {
					requesting: true,
				},
				getCurrentUser() {},
				hasFetchedAutosaves() {
					return false;
				},
				getAutosave() {
					return {
						title: 'sassel',
					};
				},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );

		it( 'should return false if the post is not saveable', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {
					requesting: true,
				},
				getCurrentUser() {},
				hasFetchedAutosaves() {
					return true;
				},
				getAutosave() {
					return {
						title: 'sassel',
					};
				},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );

		it( 'should return true if there is no autosave', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'sassel',
				},
				saving: {},
				getCurrentUser() {},
				hasFetchedAutosaves() {
					return true;
				},
				getAutosave() {},
				postAutosavingLock: {},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( true );
		} );

		it( 'should return false if none of title, excerpt, or content have changed', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
							isDirty: false,
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					title: 'foo',
					excerpt: 'foo',
				},
				saving: {},
				getCurrentUser() {},
				hasFetchedAutosaves() {
					return true;
				},
				getAutosave() {
					return {
						title: 'foo',
						excerpt: 'foo',
					};
				},
				postAutosavingLock: {},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );

		it( 'should return true if content has changes', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
							isDirty: true,
						},
						edits: {},
					},
				},
				currentPost: {
					title: 'foo',
					excerpt: 'foo',
				},
				saving: {},
				getCurrentUser() {},
				hasFetchedAutosaves() {
					return true;
				},
				getAutosave() {
					return {
						title: 'foo',
						excerpt: 'foo',
					};
				},
				postAutosavingLock: {},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( true );
		} );

		it( 'should return true if title or excerpt have changed', () => {
			for ( const variantField of [ 'title', 'excerpt' ] ) {
				for ( const constantField of without(
					[ 'title', 'excerpt' ],
					variantField
				) ) {
					const state = {
						editor: {
							present: {
								blocks: {
									isDirty: false,
									value: [],
								},
								edits: {},
							},
						},
						initialEdits: {},
						currentPost: {
							title: 'foo',
							content: 'foo',
						},
						saving: {},
						getCurrentUser() {},
						hasFetchedAutosaves() {
							return true;
						},
						getAutosave() {
							return {
								[ constantField ]: 'foo',
								[ variantField ]: 'bar',
							};
						},
						postAutosavingLock: {},
					};

					expect( isEditedPostAutosaveable( state ) ).toBe( true );
				}
			}
		} );

		it( 'should return false if autosaving is locked', () => {
			const state = {
				currentPost: {},
				saving: {},
				postAutosavingLock: { example: true },
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostEmpty', () => {
		it( 'should return true if no blocks and no content', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return false if blocks', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-block-a',
									isValid: true,
									attributes: {
										text: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );

		it( 'should account for filtering logic of getBlocksForSerialization', () => {
			// Note: As an optimization, isEditedPostEmpty avoids using the
			// getBlocksForSerialization selector and instead makes assumptions
			// about its filtering. The behavior should still be reflected.
			//
			// See: https://github.com/WordPress/gutenberg/pull/13086
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 'block1',
									name: 'core/test-default',
									attributes: {
										modified: false,
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return false if blocks, but empty content edit', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-block-a',
									isValid: true,
									attributes: {
										text: '',
									},
								},
							],
						},
						edits: {
							content: '',
						},
					},
				},
				initialEdits: {},
				currentPost: {
					content: '',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );

		it( 'should return true if the post has an empty content property', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					content: '',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return true if edits include a non-empty content property, but blocks are empty', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {
							content: 'sassel',
						},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return true if empty classic block', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return true if empty content freeform block', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					content: '',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return false if non-empty content freeform block', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: 'Test Data',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					content: 'Test Data',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );

		it( 'should return false for multiple empty freeform blocks', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
								{
									clientId: 456,
									name: 'core/test-freeform',
									isValid: true,
									attributes: {
										content: '',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {
					content: '\n\n',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostBeingScheduled', () => {
		it( 'should return true for posts with a future date', () => {
			const time = Date.now() + 1000 * 3600 * 24 * 7; // 7 days in the future.
			const date = new Date( time );
			const state = {
				editor: {
					present: {
						edits: { date: date.toUTCString() },
					},
				},
				initialEdits: {},
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
				initialEdits: {},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDateFloating', () => {
		it( 'should return true for draft posts where the date matches the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'draft',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( true );
		} );

		it( 'should return true for auto-draft posts where the date matches the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'auto-draft',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts where the date does not match the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '1970-01-01T00:00:00.000Z',
					status: 'draft',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );

		it( 'should return false for auto-draft posts where the date does not match the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '1970-01-01T00:00:00.000Z',
					status: 'auto-draft',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'publish',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );

		it( 'should return true for pending posts', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'pending',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( true );
		} );

		it( 'should return false for private posts even if the edited status is "draft"', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'private',
				},
				editor: {
					present: {
						edits: {
							status: 'draft',
						},
					},
				},
				initialEdits: {},
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );
	} );

	describe( 'isSavingPost', () => {
		it( 'should return true if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: true,
				},
			};

			expect( isSavingPost( state ) ).toBe( true );
		} );

		it( 'should return false if the post is not currently being saved', () => {
			const state = {
				saving: {
					requesting: false,
				},
			};

			expect( isSavingPost( state ) ).toBe( false );
		} );
	} );

	describe( 'isSavingNonPostEntityChanges', () => {
		it( 'should return true if changes to an arbitrary entity are being saved', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetEntitiesBeingSaved() {
					return [
						{ kind: 'someKind', name: 'someName', key: 'someKey' },
					];
				},
			};
			expect( isSavingNonPostEntityChanges( state ) ).toBe( true );
		} );
		it( 'should return false if the only changes being saved are for the current post', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetEntitiesBeingSaved() {
					return [ { kind: 'postType', name: 'post', key: 1 } ];
				},
			};
			expect( isSavingNonPostEntityChanges( state ) ).toBe( false );
		} );
		it( 'should return true if changes to multiple posts are being saved', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetEntitiesBeingSaved() {
					return [
						{ kind: 'postType', name: 'post', key: 1 },
						{ kind: 'postType', name: 'post', key: 2 },
					];
				},
			};
			expect( isSavingNonPostEntityChanges( state ) ).toBe( true );
		} );
		it( 'should return true if changes to multiple posts of different post types are being saved', () => {
			const state = {
				currentPost: { id: 1, type: 'post' },
				__experimentalGetEntitiesBeingSaved() {
					return [
						{ kind: 'postType', name: 'post', key: 1 },
						{ kind: 'postType', name: 'wp_template', key: 1 },
					];
				},
			};
			expect( isSavingNonPostEntityChanges( state ) ).toBe( true );
		} );
	} );

	describe( 'didPostSaveRequestSucceed', () => {
		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					successful: true,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					successful: false,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( false );
		} );
	} );

	describe( 'didPostSaveRequestFail', () => {
		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					error: 'error',
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					error: false,
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( false );
		} );
	} );

	describe( 'getSuggestedPostFormat', () => {
		it( 'returns null if cannot be determined', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'return null if only one block of type `core/embed` and provider not matched', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 567,
									name: 'core/embed',
									attributes: {
										providerNameSlug: 'instagram',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};
			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'return null if only one block of type `core/embed` and provider not exists', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 567,
									name: 'core/embed',
									attributes: {},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};
			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns null if there is more than one block in the post', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/image',
									attributes: {},
								},
								{
									clientId: 456,
									name: 'core/quote',
									attributes: {},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns Image if the first block is of type `core/image`', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 123,
									name: 'core/image',
									attributes: {},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'image' );
		} );

		it( 'returns Quote if the first block is of type `core/quote`', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 456,
									name: 'core/quote',
									attributes: {},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );

		it( 'returns Video if the first block is of type `core/embed from youtube`', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 567,
									name: 'core/embed',
									attributes: {
										providerNameSlug: 'youtube',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'video' );
		} );

		it( 'returns Audio if the first block is of type `core/embed from soundcloud`', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 567,
									name: 'core/embed',
									attributes: {
										providerNameSlug: 'soundcloud',
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'audio' );
		} );

		it( 'returns Quote if the first block is of type `core/quote` and second is of type `core/paragraph`', () => {
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									clientId: 456,
									name: 'core/quote',
									attributes: {},
								},
								{
									clientId: 789,
									name: 'core/paragraph',
									attributes: {},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );
	} );

	describe( 'getEditedPostContent', () => {
		let originalDefaultBlockName;

		beforeAll( () => {
			originalDefaultBlockName = getDefaultBlockName();

			registerBlockType( 'core/default', {
				category: 'text',
				title: 'default',
				attributes: {
					modified: {
						type: 'boolean',
						default: false,
					},
				},
				save: () => null,
			} );
			setDefaultBlockName( 'core/default' );
		} );

		afterAll( () => {
			setDefaultBlockName( originalDefaultBlockName );
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'serializes blocks, if any', () => {
			const block = createBlock( 'core/block' );

			const state = {
				editor: {
					present: {
						blocks: {
							value: [ block ],
						},
						edits: {
							content: 'custom edit',
						},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<!-- wp:block /-->' );
		} );

		it( 'returns serialization of blocks', () => {
			const block = createBlock( 'core/block' );

			const state = {
				editor: {
					present: {
						blocks: {
							value: [ block ],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<!-- wp:block /-->' );
		} );

		it( "returns removep'd serialization of blocks for single unknown", () => {
			const unknownBlock = createBlock( 'core/test-freeform', {
				content: '<p>foo</p>',
			} );
			const state = {
				editor: {
					present: {
						blocks: {
							value: [ unknownBlock ],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( 'foo' );
		} );

		it( "returns non-removep'd serialization of blocks for multiple unknown", () => {
			const firstUnknown = createBlock( 'core/test-freeform', {
				content: '<p>foo</p>',
			} );
			const secondUnknown = createBlock( 'core/test-freeform', {
				content: '<p>bar</p>',
			} );
			const state = {
				editor: {
					present: {
						blocks: {
							value: [ firstUnknown, secondUnknown ],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<p>foo</p>\n\n<p>bar</p>' );
		} );

		it( 'returns empty string for single unmodified default block', () => {
			const defaultBlock = createBlock( getDefaultBlockName() );
			const state = {
				editor: {
					present: {
						blocks: {
							value: [ defaultBlock ],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '' );
		} );

		it( 'should not return empty string for modified default block', () => {
			const defaultBlock = createBlock( getDefaultBlockName() );
			const state = {
				editor: {
					present: {
						blocks: {
							value: [
								{
									...defaultBlock,
									attributes: {
										...defaultBlock.attributes,
										modified: true,
									},
								},
							],
						},
						edits: {},
					},
				},
				initialEdits: {},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe(
				'<!-- wp:test-default {"modified":true} /-->'
			);
		} );
	} );

	describe( 'isPublishSidebarEnabled', () => {
		it( 'should return the value on state if it is thruthy', () => {
			const state = {
				preferences: {
					isPublishSidebarEnabled: true,
				},
			};
			expect( isPublishSidebarEnabled( state ) ).toBe(
				state.preferences.isPublishSidebarEnabled
			);
		} );

		it( 'should return the value on state if it is falsy', () => {
			const state = {
				preferences: {
					isPublishSidebarEnabled: false,
				},
			};
			expect( isPublishSidebarEnabled( state ) ).toBe(
				state.preferences.isPublishSidebarEnabled
			);
		} );

		it( 'should return the default value if there is no isPublishSidebarEnabled key on state', () => {
			const state = {
				preferences: {},
			};
			expect( isPublishSidebarEnabled( state ) ).toBe(
				PREFERENCES_DEFAULTS.isPublishSidebarEnabled
			);
		} );
	} );

	describe( 'isPermalinkEditable', () => {
		it( 'should be false if there is no permalink', () => {
			const state = {
				currentPost: { permalink_template: '' },
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isPermalinkEditable( state ) ).toBe( false );
		} );

		it( 'should be false if the permalink is not of an editable kind', () => {
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%baz%/',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isPermalinkEditable( state ) ).toBe( false );
		} );

		it( 'should be true if the permalink has %postname%', () => {
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%postname%/',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isPermalinkEditable( state ) ).toBe( true );
		} );

		it( 'should be true if the permalink has %pagename%', () => {
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%pagename%/',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( isPermalinkEditable( state ) ).toBe( true );
		} );
	} );

	describe( 'getPermalink', () => {
		it( 'should work if the permalink is not of an editable kind', () => {
			const url = 'http://foo.test/?post=1';
			const state = {
				currentPost: { permalink_template: url },
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( getPermalink( state ) ).toBe( url );
		} );

		it( 'should return the permalink if it is editable', () => {
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%postname%/',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( getPermalink( state ) ).toBe( 'http://foo.test/bar/baz/' );
		} );

		it( 'should return null if the post has no permalink template', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {},
				},
			};

			expect( getPermalink( state ) ).toBeNull();
		} );
	} );

	describe( 'getPermalinkParts', () => {
		it( 'should split the permalink correctly', () => {
			const parts = {
				prefix: 'http://foo.test/bar/',
				postName: 'baz',
				suffix: '/',
			};
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%postname%/',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( getPermalinkParts( state ) ).toEqual( parts );
		} );

		it( 'should leave an uneditable permalink in the prefix', () => {
			const parts = {
				prefix: 'http://foo.test/?post=1',
				postName: 'baz',
			};
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/?post=1',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
				initialEdits: {},
			};

			expect( getPermalinkParts( state ) ).toEqual( parts );
		} );

		it( 'should return null if the post has no permalink template', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getPermalinkParts( state ) ).toBeNull();
		} );
	} );

	describe( 'getEditedPostSlug', () => {
		it( 'should return the current post’s slug if one exists and has not been edited', () => {
			const state = {
				currentPost: {
					slug: 'custom-slug',
					title: 'Sample Post',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostSlug( state ) ).toBe( 'custom-slug' );
		} );

		it( 'should return the edited post slug if it has been edited', () => {
			const state = {
				currentPost: {
					slug: 'custom-slug',
					title: 'Sample Post',
				},
				editor: {
					present: {
						edits: {
							slug: 'edited-slug',
						},
					},
				},
			};

			expect( getEditedPostSlug( state ) ).toBe( 'edited-slug' );
		} );

		it( 'should return the cleaned title as slug if no saved or edited slug exists', () => {
			const state = {
				currentPost: {
					title: 'Sample Post',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostSlug( state ) ).toBe( 'sample-post' );
		} );

		it( 'should return cleaned, edited title as slug if it has been edited and no saved or edited slug exists', () => {
			const state = {
				currentPost: {
					title: 'Sample Post',
				},
				editor: {
					present: {
						edits: {
							title: 'Edited Title',
						},
					},
				},
			};

			expect( getEditedPostSlug( state ) ).toBe( 'edited-title' );
		} );

		it( 'should return the post ID if no slug or post title exists', () => {
			const state = {
				postId: 123,
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostSlug( state ) ).toBe( 123 );
		} );
	} );

	describe( 'canUserUseUnfilteredHTML', () => {
		it( 'should return true if the _links object contains the property wp:action-unfiltered-html', () => {
			const state = {
				currentPost: {
					_links: {
						'wp:action-unfiltered-html': [],
					},
				},
			};
			expect( canUserUseUnfilteredHTML( state ) ).toBe( true );
		} );
		it( 'should return false if the _links object doesnt contain the property wp:action-unfiltered-html', () => {
			const state = {
				currentPost: {
					_links: {},
				},
			};
			expect( canUserUseUnfilteredHTML( state ) ).toBe( false );
		} );
	} );

	describe( '__experimentalGetDefaultTemplateTypes', () => {
		const state = { editorSettings: { defaultTemplateTypes } };

		it( 'returns undefined if there are no default template types', () => {
			const emptyState = { editorSettings: {} };
			expect(
				__experimentalGetDefaultTemplateTypes( emptyState )
			).toBeUndefined();
		} );

		it( 'returns a list of default template types if present in state', () => {
			expect(
				__experimentalGetDefaultTemplateTypes( state )
			).toHaveLength( 2 );
		} );
	} );

	describe( '__experimentalGetDefaultTemplatePartAreas', () => {
		const state = { editorSettings: { defaultTemplatePartAreas } };

		it( 'returns empty array if there are no default template part areas', () => {
			const emptyState = { editorSettings: {} };
			expect(
				__experimentalGetDefaultTemplatePartAreas( emptyState )
			).toHaveLength( 0 );
		} );

		it( 'returns a list of default template part areas if present in state', () => {
			expect(
				__experimentalGetDefaultTemplatePartAreas( state )
			).toHaveLength( 2 );
		} );

		it( 'assigns an icon to each area', () => {
			const templatePartAreas = __experimentalGetDefaultTemplatePartAreas(
				state
			);
			templatePartAreas.forEach( ( area ) =>
				expect( area.icon ).not.toBeNull()
			);
		} );
	} );

	describe( '__experimentalGetDefaultTemplateType', () => {
		const state = { editorSettings: { defaultTemplateTypes } };

		it( 'returns an empty object if there are no default template types', () => {
			const emptyState = { editorSettings: {} };
			expect(
				__experimentalGetDefaultTemplateType( emptyState, 'slug' )
			).toEqual( {} );
		} );

		it( 'returns an empty object if the requested slug is not found', () => {
			expect(
				__experimentalGetDefaultTemplateType( state, 'foobar' )
			).toEqual( {} );
		} );

		it( 'returns the requested default template type', () => {
			expect(
				__experimentalGetDefaultTemplateType( state, 'index' )
			).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
				slug: 'index',
			} );
		} );

		it( 'returns the requested default template type even when the slug is numeric', () => {
			expect(
				__experimentalGetDefaultTemplateType( state, '404' )
			).toEqual( {
				title: '404 (Not Found)',
				description: 'Applied when content cannot be found',
				slug: '404',
			} );
		} );
	} );

	describe( '__experimentalGetTemplateInfo', () => {
		const state = {
			editorSettings: { defaultTemplateTypes, defaultTemplatePartAreas },
		};

		it( 'should return an empty object if no template is passed', () => {
			expect( __experimentalGetTemplateInfo( state, null ) ).toEqual(
				{}
			);
			expect( __experimentalGetTemplateInfo( state, undefined ) ).toEqual(
				{}
			);
			expect( __experimentalGetTemplateInfo( state, false ) ).toEqual(
				{}
			);
		} );

		it( 'should return the default title if none is defined on the template', () => {
			expect(
				__experimentalGetTemplateInfo( state, { slug: 'index' } ).title
			).toEqual( 'Default (Index)' );
		} );

		it( 'should return the rendered title if defined on the template', () => {
			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} ).title
			).toEqual( 'test title' );
		} );

		it( 'should return the slug if no title is found', () => {
			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'not a real template',
				} ).title
			).toEqual( 'not a real template' );
		} );

		it( 'should return the default description if none is defined on the template', () => {
			expect(
				__experimentalGetTemplateInfo( state, { slug: 'index' } )
					.description
			).toEqual( 'Main template' );
		} );

		it( 'should return the raw excerpt as description if defined on the template', () => {
			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} ).description
			).toEqual( 'test description' );
		} );

		it( 'should return a title, description, and icon', () => {
			expect(
				__experimentalGetTemplateInfo( state, { slug: 'index' } )
			).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
				icon: layout,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'Main template',
				icon: layout,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'Default (Index)',
				description: 'test description',
				icon: layout,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'test description',
				icon: layout,
			} );
		} );

		it( 'should return correct icon based on area', () => {
			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'template part, area = uncategorized',
					area: 'uncategorized',
				} )
			).toEqual( {
				title: 'template part, area = uncategorized',
				icon: layout,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'template part, area = invalid',
					area: 'invalid',
				} )
			).toEqual( {
				title: 'template part, area = invalid',
				icon: layout,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'template part, area = header',
					area: 'header',
				} )
			).toEqual( {
				title: 'template part, area = header',
				icon: header,
			} );

			expect(
				__experimentalGetTemplateInfo( state, {
					slug: 'template part, area = footer',
					area: 'footer',
				} )
			).toEqual( {
				title: 'template part, area = footer',
				icon: footer,
			} );
		} );
	} );

	describe( 'getPostTypeLabel', () => {
		it( 'should return the correct label for the current post type', () => {
			const postTypes = [
				{
					state: {
						postType: 'page',
					},
					expected: 'Page',
				},
				{
					state: {
						postType: 'post',
					},
					expected: 'Post',
				},
			];

			postTypes.forEach( ( { state, expected } ) =>
				expect( getPostTypeLabel( state ) ).toBe( expected )
			);
		} );

		it( 'should return `undefined` when the post type label does not exist', () => {
			const postTypes = [ {}, { postType: 'humpty' } ];

			postTypes.forEach( ( state ) =>
				expect( getPostTypeLabel( state ) ).toBeUndefined()
			);
		} );
	} );
} );
