import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );
import { store as editorStore } from '..';
import * as actions from '../actions';
import { EDITOR_INTENT_SUGGEST } from '../constants';
import { unlock } from '../../lock-unlock';

const postId = 44;

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
		item_reverted_to_draft: 'Post reverted to draft.',
		item_trashed: 'Post trashed.',
	},
};

function createRegistryWithStores() {
	// Create a registry.
	const registry = createRegistry();

	// Register stores.
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	return registry;
}

const getMethod = ( options ) =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

describe( 'Post actions', () => {
	describe( 'setCanvasWidth', () => {
		it( 'syncs the viewport style state while Responsive editing is enabled', () => {
			const registry = createRegistryWithStores();
			const getViewport = () =>
				unlock(
					registry.select( blockEditorStore )
				).getStyleStateViewport();
			const setCanvasWidth = ( width ) =>
				unlock( registry.dispatch( editorStore ) ).setCanvasWidth(
					width
				);

			unlock(
				registry.dispatch( blockEditorStore )
			).setResponsiveEditing( true );

			// A tablet-sized canvas selects the tablet viewport.
			setCanvasWidth( 600 );
			expect( getViewport() ).toBe( '@tablet' );

			// A mobile-sized canvas selects the mobile viewport.
			setCanvasWidth( 400 );
			expect( getViewport() ).toBe( '@mobile' );

			// A full-width (desktop) canvas resets to the default viewport.
			setCanvasWidth( undefined );
			expect( getViewport() ).toBe( 'default' );
		} );

		it( 'syncs the viewport style state using custom viewport settings', () => {
			const registry = createRegistryWithStores();
			const getViewport = () =>
				unlock(
					registry.select( blockEditorStore )
				).getStyleStateViewport();
			const setCanvasWidth = ( width ) =>
				unlock( registry.dispatch( editorStore ) ).setCanvasWidth(
					width
				);

			registry.dispatch( blockEditorStore ).updateSettings( {
				__experimentalFeatures: {
					viewport: {
						mobile: '640px',
						tablet: '1024px',
					},
				},
			} );
			unlock(
				registry.dispatch( blockEditorStore )
			).setResponsiveEditing( true );

			setCanvasWidth( 600 );
			expect( getViewport() ).toBe( '@mobile' );

			setCanvasWidth( 800 );
			expect( getViewport() ).toBe( '@tablet' );

			setCanvasWidth( 1200 );
			expect( getViewport() ).toBe( 'default' );
		} );

		it( 'leaves the viewport style state untouched while Responsive editing is disabled', () => {
			const registry = createRegistryWithStores();
			const getViewport = () =>
				unlock(
					registry.select( blockEditorStore )
				).getStyleStateViewport();

			unlock( registry.dispatch( editorStore ) ).setCanvasWidth( 400 );

			expect( getViewport() ).toBe( 'default' );
		} );
	} );

	describe( 'setDeviceType', () => {
		it( 'sets the canvas one pixel inside a custom rem viewport breakpoint', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( blockEditorStore ).updateSettings( {
				__experimentalFeatures: {
					viewport: {
						mobile: '40rem',
						tablet: '64rem',
					},
				},
			} );

			unlock( registry.dispatch( editorStore ) ).setDeviceType(
				'Tablet'
			);

			expect(
				unlock( registry.select( editorStore ) ).getCanvasWidth()
			).toBe( 1023 );
			expect( registry.select( editorStore ).getDeviceType() ).toBe(
				'Tablet'
			);
		} );

		it( 'does not set a tablet canvas width when the tablet breakpoint is not larger than mobile', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( blockEditorStore ).updateSettings( {
				__experimentalFeatures: {
					viewport: {
						mobile: '64rem',
						tablet: '40rem',
					},
				},
			} );

			unlock( registry.dispatch( editorStore ) ).setDeviceType(
				'Tablet'
			);

			expect(
				unlock( registry.select( editorStore ) ).getCanvasWidth()
			).toBe( undefined );
			expect( registry.select( editorStore ).getDeviceType() ).toBe(
				'Desktop'
			);
		} );
	} );

	describe( 'editPost()', () => {
		const draftPost = {
			id: postId,
			type: 'post',
			title: 'bar',
			content: 'bar',
			excerpt: 'crackers',
			status: 'draft',
			password: 'hunter2',
		};
		const REFUSED_STATUS_MESSAGE =
			"The post status can't be changed while suggesting. Switch to Editing to change it.";

		function setupPost() {
			const registry = createRegistryWithStores();
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', draftPost );
			registry.dispatch( editorStore ).setupEditor( draftPost );
			return registry;
		}

		it( 'refuses a post status edit while suggesting', () => {
			const registry = setupPost();
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				EDITOR_INTENT_SUGGEST
			);
			speak.mockClear();

			registry.dispatch( editorStore ).editPost( { status: 'pending' } );

			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'status' )
			).toBe( 'draft' );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
			expect( speak ).toHaveBeenCalledWith(
				REFUSED_STATUS_MESSAGE,
				'assertive'
			);
		} );

		it( 'shows the refusal in a snackbar, not only to screen readers', () => {
			const registry = setupPost();
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				EDITOR_INTENT_SUGGEST
			);

			registry.dispatch( editorStore ).editPost( { status: 'pending' } );

			const refusals = registry
				.select( noticesStore )
				.getNotices()
				.filter(
					( { id } ) => id === 'editor-suggest-locked-post-status'
				);
			expect( refusals ).toEqual( [
				expect.objectContaining( {
					content: REFUSED_STATUS_MESSAGE,
					type: 'snackbar',
					// `speak` already announced it; a spoken snackbar would
					// repeat the same sentence.
					spokenMessage: null,
				} ),
			] );

			// A second refusal replaces the first rather than stacking.
			registry.dispatch( editorStore ).editPost( { status: 'publish' } );

			expect(
				registry
					.select( noticesStore )
					.getNotices()
					.filter(
						( { id } ) => id === 'editor-suggest-locked-post-status'
					)
			).toHaveLength( 1 );
		} );

		it( 'refuses the whole call, so a companion edit cannot land without its status', () => {
			const registry = setupPost();
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				EDITOR_INTENT_SUGGEST
			);

			/*
			 * The shape `PostVisibility` sends for "Private". Dropping only the
			 * status would strip the password while leaving the post published
			 * - a state nobody asked for.
			 */
			registry
				.dispatch( editorStore )
				.editPost( { status: 'private', password: '' } );

			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'status' )
			).toBe( 'draft' );
			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'password' )
			).toBe( draftPost.password );
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);
		} );

		it( 'lets a call through when it only repeats the status it already has', () => {
			const registry = setupPost();
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				EDITOR_INTENT_SUGGEST
			);
			speak.mockClear();

			/*
			 * `PostVisibility` sends the current status alongside every
			 * visibility choice. Nothing is being changed, so there is nothing
			 * to refuse and nothing to announce.
			 */
			registry
				.dispatch( editorStore )
				.editPost( { status: 'draft', excerpt: 'new crackers' } );

			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'excerpt' )
			).toBe( 'new crackers' );
			expect( speak ).not.toHaveBeenCalled();
			// The no-op status was dropped rather than written back as an edit.
			expect(
				registry
					.select( coreStore )
					.getEntityRecordEdits( 'postType', 'post', draftPost.id )
			).not.toHaveProperty( 'status' );
		} );

		it( 'discards a status staged while editing when the suggest intent is entered', () => {
			const registry = setupPost();

			registry.dispatch( editorStore ).editPost( { status: 'pending' } );
			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'status' )
			).toBe( 'pending' );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				EDITOR_INTENT_SUGGEST
			);

			/*
			 * `savePost` is not guarded, so a status left staged from Editing
			 * would be written on the next save - the workflow change this
			 * intent withholds, applied without anyone choosing it here.
			 */
			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'status' )
			).toBe( 'draft' );
			expect(
				registry
					.select( coreStore )
					.getEntityRecordEdits( 'postType', 'post', draftPost.id )
			).not.toHaveProperty( 'status' );
		} );

		it( 'applies a post status edit while editing', () => {
			const registry = setupPost();

			registry.dispatch( editorStore ).editPost( { status: 'pending' } );

			expect(
				registry
					.select( editorStore )
					.getEditedPostAttribute( 'status' )
			).toBe( 'pending' );
		} );
	} );

	describe( 'savePost()', () => {
		it( 'saves a modified post', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					return { ...post, ...data };
				} else if (
					// This URL is requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post and initial edits.
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			// Check that the post is dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			// Save the post.
			await registry.dispatch( editorStore ).savePost();

			// Check the new content.
			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			// Check that the post is no longer dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			// Check that a success notice has been shown.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'Draft saved.',
				},
			] );
		} );

		it( 'adds a details action for save failures with a plain-text error message', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'publish',
			};

			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					throw {
						code: 'test_save_failure',
						message: 'Details from server.',
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			await registry.dispatch( editorStore ).savePost();

			const [ notice ] = registry.select( noticesStore ).getNotices();
			expect( notice ).toMatchObject( {
				status: 'error',
				__unstableHTML: true,
			} );
			expect( notice.content ).toContain(
				'Updating failed. We’ll try to save a backup in this browser. Please try updating again.'
			);
			expect( notice.content ).toContain(
				'<details class="editor-save-error-details">'
			);
			expect( notice.content ).toContain(
				'<summary>Show details</summary>'
			);
			expect( notice.content ).toContain( 'Details from server.' );
			expect( notice.actions ).toEqual( [] );
			expect( notice.spokenMessage ).toBeNull();
			expect( notice.content ).toContain(
				'<span class="editor-save-error-details__message">Details from server.</span>'
			);
			expect( speak ).toHaveBeenCalledWith(
				'Updating failed. We’ll try to save a backup in this browser. Please try updating again.',
				'assertive'
			);
		} );

		// These errors are generated by the client rather than returned by the
		// server, so their message only restates the notice itself.
		[
			[
				'offline_error',
				'Unable to connect. Please check your Internet connection.',
				'Updating failed because you were offline. Please verify your connection and try again.',
			],
			[
				'fetch_error',
				'Could not get a valid response from the server.',
				'Updating failed. We’ll try to save a backup in this browser. Please try updating again.',
			],
		].forEach( ( [ code, message, expectedNotice ] ) => {
			it( `omits the details disclosure for ${ code } failures`, async () => {
				const post = {
					id: postId,
					type: 'post',
					title: 'bar',
					content: 'bar',
					excerpt: 'crackers',
					status: 'publish',
				};

				apiFetch.setFetchHandler( async ( options ) => {
					const method = getMethod( options );
					const { path } = options;

					if (
						method === 'PUT' &&
						path.startsWith( `/wp/v2/posts/${ postId }` )
					) {
						throw { code, message };
					}

					throw {
						code: 'unknown_path',
						message: `Unknown path: ${ method } ${ path }`,
					};
				} );

				const registry = createRegistryWithStores();

				registry
					.dispatch( coreStore )
					.receiveEntityRecords( 'postType', 'post', post );

				registry.dispatch( editorStore ).setupEditor( post, {
					content: 'new bar',
				} );

				await registry.dispatch( editorStore ).savePost();

				const [ notice ] = registry.select( noticesStore ).getNotices();
				expect( notice.content ).toBe( expectedNotice );
				expect( notice.content ).not.toContain( '<details' );
				expect( notice.content ).not.toContain( 'Show details' );
				expect( notice.__unstableHTML ).toBeUndefined();
			} );
		} );
	} );

	describe( 'autosave()', () => {
		it( 'autosaves a modified post', async () => {
			const post = {
				id: postId,
				type: 'post',
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: 'draft',
			};

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/users/me' )
				) {
					return { id: 1 };
				} else if (
					path.startsWith( `/wp/v2/posts/${ postId }/autosaves` )
				) {
					if ( method === 'POST' ) {
						return { ...post, ...data };
					} else if ( method === 'GET' ) {
						return [];
					}
				} else if ( method === 'GET' ) {
					// These URLs are requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
					if (
						path.startsWith( '/wp/v2/types/post' ) ||
						path.startsWith( `/wp/v2/posts/${ postId }` )
					) {
						return {
							json: () => Promise.resolve( {} ),
						};
					}
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Set current user.
			registry.dispatch( coreStore ).receiveCurrentUser( { id: 1 } );

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post and initial edits.
			registry.dispatch( editorStore ).setupEditor( post, {
				content: 'new bar',
			} );

			// Check that the post is dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			// Autosave the post.
			await registry.dispatch( editorStore ).autosave();

			// Check the new content.
			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			// Check that the post is no longer dirty.
			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			// Check that no notice has been shown on autosave.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [] );
		} );
	} );

	describe( 'trashPost()', () => {
		it( 'trashes a post', async () => {
			const post = {
				id: postId,
				type: 'post',
				content: 'foo',
				status: 'publish',
			};

			let gotTrashed = false;

			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if ( path.startsWith( `/wp/v2/posts/${ postId }` ) ) {
					if ( method === 'DELETE' ) {
						gotTrashed = true;
						return { ...post, status: 'trash' };
					} else if ( method === 'PUT' ) {
						return {
							...post,
							...( gotTrashed && { status: 'trash' } ),
							...data,
						};
					}
					// This URL is requested by the actions dispatched in this test.
					// They are safe to ignore and are only listed here to avoid triggeringan error.
				} else if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					return {
						json: () => Promise.resolve( {} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ path }`,
				};
			} );

			// Create registry.
			const registry = createRegistryWithStores();

			// Store post.
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );

			// Setup editor with post.
			registry.dispatch( editorStore ).setupEditor( post );

			// Trash the post.
			await registry.dispatch( editorStore ).trashPost();

			// Check that there are no notices.
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'Post trashed.',
				},
			] );

			// Check the new status.
			const { status } = registry.select( editorStore ).getCurrentPost();
			expect( status ).toBe( 'trash' );
		} );

		it( 'sets deleting state', async () => {
			const post = {
				id: postId,
				type: 'post',
				content: 'foo',
				status: 'publish',
			};

			const dispatch = Object.assign( jest.fn(), {
				savePost: jest.fn(),
			} );
			const select = {
				getCurrentPostType: () => 'post',
				getCurrentPost: () => post,
			};
			const registry = {
				dispatch: () => ( {
					removeNotice: jest.fn(),
					createErrorNotice: jest.fn(),
				} ),
				resolveSelect: () => ( {
					getPostType: () => ( {
						rest_namespace: 'wp/v2',
						rest_base: 'posts',
					} ),
				} ),
			};

			apiFetch.setFetchHandler( async () => {
				return { ...post, status: 'trash' };
			} );

			await actions.trashPost()( { select, dispatch, registry } );

			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REQUEST_POST_DELETE_START',
			} );
			expect( dispatch ).toHaveBeenCalledWith( {
				type: 'REQUEST_POST_DELETE_FINISH',
			} );
		} );
	} );
} );

describe( 'Editor actions', () => {
	describe( 'setupEditor()', () => {
		it( 'should setup the editor', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			registry
				.dispatch( editorStore )
				.setupEditor( { id: 10, type: 'post' } );
			expect( registry.select( editorStore ).getCurrentPostId() ).toBe(
				10
			);
		} );
	} );

	describe( 'lockPostSaving', () => {
		it( 'should return the LOCK_POST_SAVING action', () => {
			const result = actions.lockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostSaving', () => {
		it( 'should return the UNLOCK_POST_SAVING action', () => {
			const result = actions.unlockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'lockPostAutosaving', () => {
		it( 'should return the LOCK_POST_AUTOSAVING action', () => {
			const result = actions.lockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostAutosaving', () => {
		it( 'should return the UNLOCK_POST_AUTOSAVING action', () => {
			const result = actions.unlockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'enablePublishSidebar', () => {
		it( 'enables the publish sidebar', () => {
			const registry = createRegistryWithStores();

			// Starts off as `undefined` as a default hasn't been set.
			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( false );

			registry.dispatch( editorStore ).enablePublishSidebar();

			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( true );
		} );
	} );

	describe( 'disablePublishSidebar', () => {
		it( 'disables the publish sidebar', () => {
			const registry = createRegistryWithStores();

			// Enable it to start with so that can test it flipping from `true` to `false`.
			registry.dispatch( editorStore ).enablePublishSidebar();
			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( true );

			registry.dispatch( editorStore ).disablePublishSidebar();

			expect(
				registry.select( editorStore ).isPublishSidebarEnabled()
			).toBe( false );
		} );
	} );

	describe( 'toggleEditorPanelEnabled', () => {
		it( 'toggles panels to be enabled and not enabled', () => {
			const registry = createRegistryWithStores();

			// This will switch it off, since the default is on.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( false );

			// Switch it on again.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelEnabled( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelEnabled( 'control-panel' )
			).toBe( true );
		} );
	} );

	describe( 'toggleEditorPanelOpened', () => {
		it( 'toggles panels open and closed', () => {
			const registry = createRegistryWithStores();

			// This will open it, since the default is closed.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( true );

			// Close it.
			registry
				.dispatch( editorStore )
				.toggleEditorPanelOpened( 'control-panel' );

			expect(
				registry
					.select( editorStore )
					.isEditorPanelOpened( 'control-panel' )
			).toBe( false );
		} );
	} );

	describe( 'switchEditorMode', () => {
		let registry;

		beforeEach( () => {
			registry = createRegistryWithStores();
		} );

		it( 'to visual', () => {
			// Switch to text first, since the default is visual.
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
			registry.dispatch( editorStore ).switchEditorMode( 'visual' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'to text', () => {
			// It defaults to visual.
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
			// Add a selected client id and make sure it's there.
			const clientId = 'clientId_1';
			registry.dispatch( blockEditorStore ).selectionChange( clientId );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toEqual( clientId );

			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect(
				registry.select( blockEditorStore ).getSelectedBlockClientId()
			).toBeNull();
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
		} );
		it( 'should turn off distraction free mode when switching to code editor', () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', true );
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'distractionFree' )
			).toBe( false );
		} );

		it( 'refuses to switch to the code editor while suggesting', () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);

			registry.dispatch( editorStore ).switchEditorMode( 'text' );

			// The stored preference is untouched, so leaving the suggest
			// intent does not strand the user in the code editor.
			expect(
				registry.select( preferencesStore ).get( 'core', 'editorMode' )
			).toBeUndefined();
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'refuses the code editor while suggestions are pending, whatever the intent', () => {
			const post = {
				id: postId,
				type: 'post',
				status: 'draft',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Hello <mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="add">there</mark></p><!-- /wp:paragraph -->',
				excerpt: '',
			};
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			// Precondition: the marker is in the document the code editor
			// would hand back to be re-parsed.
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toContain( 'wp-suggestion' );

			// The Edit intent, not Suggest: re-parsing an edited document
			// destroys the markers whoever made the edit.
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'edit' );

			registry.dispatch( editorStore ).switchEditorMode( 'text' );

			expect(
				registry.select( preferencesStore ).get( 'core', 'editorMode' )
			).toBeUndefined();
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'surfaces the refusal as a notice, not only as an announcement', () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			speak.mockClear();

			registry.dispatch( editorStore ).switchEditorMode( 'text' );

			// A sighted keyboard user pressing the shortcut sees nothing
			// change unless the refusal is also on screen.
			expect( speak ).toHaveBeenCalledWith(
				expect.stringContaining( 'suggestions' ),
				'assertive'
			);
			expect(
				registry
					.select( noticesStore )
					.getNotices()
					.map( ( notice ) => notice.content )
			).toContain(
				'Raw HTML edits cannot be captured as suggestions. Switch to Editing to use the code editor.'
			);
		} );

		it( 'still opens the code editor with no suggestions pending', () => {
			registry.dispatch( editorStore ).switchEditorMode( 'text' );

			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
		} );

		it( 'reports the visual editor while suggesting, and restores the stored mode on the way out', () => {
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
		} );

		it( 'reports the visual editor on load when the post already carries markers', () => {
			// The stored preference is the code editor, as it would be for
			// someone who works in raw HTML.
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'editorMode', 'text' );

			const post = {
				id: postId,
				type: 'post',
				status: 'draft',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Hello <mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="add">there</mark></p><!-- /wp:paragraph -->',
				excerpt: '',
			};
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			// Nothing was dispatched: opening a post with suggestions left to
			// resolve is enough to put the code editor on screen, and the
			// markers with it.
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
			// The preference itself is untouched, so the code editor returns
			// once the suggestions are resolved.
			expect(
				registry.select( preferencesStore ).get( 'core', 'editorMode' )
			).toEqual( 'text' );
		} );

		it( 'keeps the code editor masked when leaving Suggesting with markers pending', () => {
			const post = {
				id: postId,
				type: 'post',
				status: 'draft',
				title: 'bar',
				content:
					'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
				excerpt: '',
			};
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			// A code-editor user with nothing to resolve yet.
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);

			// Suggesting masks the preference and swaps in the canvas.
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);

			// A suggestion is made, leaving a marker in the document.
			registry
				.dispatch( coreStore )
				.editEntityRecord( 'postType', 'post', postId, {
					content:
						'<!-- wp:paragraph --><p>Hello <mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="add">there</mark></p><!-- /wp:paragraph -->',
				} );

			// Back to Editing with the suggestion still unresolved. Lifting
			// the mask here hands the marker to the code editor as writable
			// raw HTML - the corruption `switchEditorMode` refuses, reached
			// without dispatching it.
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'visual'
			);
		} );

		it( 'does not mistake unrelated markup for a pending marker', () => {
			const post = {
				id: postId,
				type: 'post',
				status: 'draft',
				title: 'bar',
				content:
					'<!-- wp:paragraph {"className":"wp-suggestion-box"} --><p class="wp-suggestion-box">A callout.</p><!-- /wp:paragraph -->' +
					'<!-- wp:code --><pre class="wp-block-code"><code>&lt;mark class="wp-suggestion" data-suggestion-id="1"&gt;</code></pre><!-- /wp:code -->',
				excerpt: '',
			};
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', post );
			registry.dispatch( editorStore ).setupEditor( post );

			// Precondition: the cheap containment probe hits, but neither a
			// class named after the marker nor a code sample showing its
			// markup is a marker.
			expect(
				registry.select( editorStore ).getEditedPostContent()
			).toContain( 'wp-suggestion' );

			registry.dispatch( editorStore ).switchEditorMode( 'text' );

			expect( registry.select( editorStore ).getEditorMode() ).toEqual(
				'text'
			);
			expect(
				registry
					.select( noticesStore )
					.getNotices()
					.map( ( notice ) => notice.content )
			).toEqual( [] );
		} );
	} );

	describe( 'setEditorIntent', () => {
		let registry;

		beforeEach( () => {
			registry = createRegistryWithStores();
			speak.mockClear();
		} );

		it( 'defaults to edit', () => {
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'edit' );
		} );

		it( 'switches between edit, suggest, and view', () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'suggest' );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'view'
			);
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'view' );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'edit' );
		} );

		it( 'ignores unknown intents', () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'bogus'
			);
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'suggest' );
		} );

		it( 'refuses the suggest intent when the visual editor is unavailable', () => {
			registry.dispatch( editorStore ).updateEditorSettings( {
				richEditingEnabled: false,
			} );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);

			// Suggestions are inline markers the code editor cannot render,
			// so entering the intent here would either strand the user or
			// force back the visual editor they turned off.
			expect(
				unlock( registry.select( editorStore ) ).getEditorIntent()
			).toEqual( 'edit' );
			expect(
				registry
					.select( noticesStore )
					.getNotices()
					.map( ( notice ) => notice.content )
			).toEqual( [ expect.stringContaining( 'visual editor' ) ] );
		} );

		it( 'announces the canvas swap when the intent changes the effective mode', () => {
			registry.dispatch( editorStore ).switchEditorMode( 'text' );
			speak.mockClear();

			// `switchEditorMode` - which owns the mode announcement - is
			// never dispatched here, so the intent action has to carry it.
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect( speak ).toHaveBeenCalledWith(
				expect.stringContaining( 'Visual editor selected' ),
				'assertive'
			);

			speak.mockClear();
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
			expect( speak ).toHaveBeenCalledWith(
				expect.stringContaining( 'Code editor selected' ),
				'assertive'
			);
		} );

		it( 'leaves the announcement alone when the mode is unaffected', () => {
			speak.mockClear();

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'view'
			);

			expect( speak ).toHaveBeenCalledWith(
				"You're viewing",
				'assertive'
			);
		} );

		it( 'announces a change of intent, but not a repeat of the current one', () => {
			const getNotices = () =>
				registry.select( noticesStore ).getNotices();

			// The store boots at `edit`, so re-selecting it stays silent.
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'edit'
			);
			expect( getNotices() ).toHaveLength( 0 );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect( getNotices() ).toHaveLength( 1 );
			expect( getNotices()[ 0 ] ).toMatchObject( {
				type: 'snackbar',
				content: "You're suggesting",
			} );

			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'suggest'
			);
			expect( getNotices() ).toHaveLength( 1 );
		} );

		it( 'leaves the announcement to the snackbar', () => {
			// `Snackbar` speaks its own content politely from an effect. The
			// action must not announce as well, or the mode is said twice and
			// the assertive update interrupts the polite one.
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'view'
			);

			const [ notice ] = registry.select( noticesStore ).getNotices();
			expect( notice.content ).toBe( "You're viewing" );
			// The snackbar speaks this, once, politely.
			expect( notice.spokenMessage ).toBe( "You're viewing" );
			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'does not write to the preferences store (session-scoped only)', () => {
			unlock( registry.dispatch( editorStore ) ).setEditorIntent(
				'view'
			);
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'editorIntent' )
			).toBeUndefined();
		} );
	} );

	describe( 'toggleDistractionFree', () => {
		it( 'should properly update settings to prevent layout corruption when enabling distraction free mode', () => {
			const registry = createRegistryWithStores();

			// Enable everything that shouldn't be enabled in distraction free mode.
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'fixedToolbar', true );
			registry.dispatch( editorStore ).setIsListViewOpened( true );
			// Initial state is falsy.
			registry.dispatch( editorStore ).toggleDistractionFree();
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'fixedToolbar' )
			).toBe( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
			expect(
				registry
					.select( preferencesStore )
					.get( 'core', 'distractionFree' )
			).toBe( true );
		} );
	} );

	describe( 'setIsInserterOpened', () => {
		it( 'should open and close the inserter', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsInserterOpened( true );

			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);

			registry.dispatch( editorStore ).setIsInserterOpened( false );

			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
		} );

		it( 'the list view should close when the inserter is opened', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsListViewOpened( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);

			registry.dispatch( editorStore ).setIsInserterOpened( true );
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
		} );
	} );

	describe( 'setIsListViewOpened', () => {
		it( 'should open and close the list view', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsListViewOpened( true );

			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);

			registry.dispatch( editorStore ).setIsListViewOpened( false );

			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);
		} );

		it( 'the inserter should close when the list view is opened', () => {
			const registry = createRegistryWithStores();

			registry.dispatch( editorStore ).setIsInserterOpened( true );
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				false
			);

			registry.dispatch( editorStore ).setIsListViewOpened( true );
			expect( registry.select( editorStore ).isListViewOpened() ).toBe(
				true
			);
			expect( registry.select( editorStore ).isInserterOpened() ).toBe(
				false
			);
		} );
	} );
} );
