import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );
import { store as editorStore } from '..';
import * as actions from '../actions';
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

	describe( 'savePost() attaching media', () => {
		// `getEditorBlocks` parses the post's content when there is no `blocks`
		// edit, so the block type has to exist for an image to be recognisable.
		beforeEach( () => {
			registerBlockType( 'core/image', {
				title: 'Image',
				category: 'media',
				// Anything below 3 warns about iframe compatibility.
				apiVersion: 3,
				attributes: { id: { type: 'number' } },
				save: () => null,
			} );
		} );

		afterEach( () => {
			unregisterBlockType( 'core/image' );
		} );

		const imagePost = {
			id: postId,
			type: 'post',
			title: 'bar',
			// Void form, so it validates against the minimal `save` registered
			// above — the markup is incidental, the `id` attribute is the point.
			content: '<!-- wp:image {"id":12} /-->',
			excerpt: 'crackers',
			status: 'draft',
		};

		/**
		 * Answers everything `savePost` and the attach need, recording each
		 * request so the test can assert on what was and wasn't issued.
		 *
		 * @param {string[]} requests         Collects `METHOD path` for every call.
		 * @param {Function} [duringPostSave] Run while the post's own save is in
		 *                                    flight, to stand in for the user
		 *                                    editing before it comes back.
		 */
		function setFetchHandler( requests, duringPostSave ) {
			attachedTo = undefined;
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;
				requests.push( `${ method } ${ path }` );

				if ( method === 'DELETE' ) {
					return { ...imagePost, status: 'trash' };
				}
				if ( method === 'PUT' && path.startsWith( '/wp/v2/media/' ) ) {
					attachedTo = data.post;
					return { id: 12, post: data.post };
				}
				if ( method === 'GET' && path.startsWith( '/wp/v2/media' ) ) {
					// Answer what was actually asked for. Returning a fixed
					// record instead would mask the whole bug: a request that
					// wrongly includes the template's image would still come
					// back with only the post's.
					const requested = [
						...path.matchAll( /include(?:%5B\d+%5D)?=(\d+)/g ),
					].map( ( match ) => Number( match[ 1 ] ) );

					// Also resolved with `parse: false`, so the totals headers
					// can be read. `link` must be absent or the fetch-all
					// middleware follows a next page.
					return {
						json: async () =>
							requested.map( ( id ) => ( { id, post: null } ) ),
						headers: {
							get: ( name ) =>
								name.toLowerCase() === 'link' ? null : '1',
						},
					};
				}
				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					duringPostSave?.();
					return { ...imagePost, ...data };
				}
				if (
					method === 'GET' &&
					path.startsWith( '/wp/v2/types/post' )
				) {
					// Resolved with `parse: false`, so this has to look like a
					// Response rather than the record itself.
					return {
						json: async () => ( {
							...postTypeEntity,
							viewable: true,
						} ),
					};
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );
		}

		const hasAttached = ( requests ) =>
			requests.some( ( request ) =>
				request.startsWith( 'PUT /wp/v2/media/12' )
			);

		// What was written, not just that something was.
		let attachedTo;

		/**
		 * The attach is deliberately not awaited by `savePost`, so give its
		 * requests a chance to land before asserting they did not.
		 */
		async function flush() {
			for ( let i = 0; i < 20; i++ ) {
				await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			}
		}

		function setUpEditor( registry ) {
			// Only the `post` entity is registered by default, and without a
			// config for attachments the records lookup cannot resolve.
			registry.dispatch( coreStore ).addEntities( [
				{
					kind: 'postType',
					name: 'attachment',
					baseURL: '/wp/v2/media',
					rawAttributes: [ 'title', 'excerpt', 'content' ],
					// As `loadPostTypeEntities` configures it. Without this the
					// resolver takes its unpaginated branch, which isn't the one
					// that runs in the editor.
					supportsPagination: true,
				},
			] );
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'postType', 'post', imagePost );
			registry.dispatch( editorStore ).setupEditor( imagePost, {
				content: imagePost.content,
			} );
			// The block editor store is populated by the editor provider, which
			// isn't mounted here — and without blocks there is no media to find,
			// so every assertion below would pass whether the guards work or not.
			registry.dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId: 'image-1',
					name: 'core/image',
					isValid: true,
					attributes: { id: 12 },
					innerBlocks: [],
				},
			] );
		}

		/**
		 * `savePost` reads the post's blocks up front, next to the content it
		 * sends. An image added while the request is in flight was not part of
		 * this save, so it waits for the next one.
		 */
		it( 'attaches what was saved, not media added mid-save', async () => {
			const requests = [];
			const registry = createRegistryWithStores();
			setFetchHandler( requests, () => {
				registry.dispatch( editorStore ).editPost( {
					blocks: [
						{
							clientId: 'image-1',
							name: 'core/image',
							isValid: true,
							attributes: { id: 12 },
							innerBlocks: [],
						},
						{
							clientId: 'image-2',
							name: 'core/image',
							isValid: true,
							attributes: { id: 77 },
							innerBlocks: [],
						},
					],
				} );
			} );
			setUpEditor( registry );

			await registry.dispatch( editorStore ).savePost();
			await flush();

			expect( hasAttached( requests ) ).toBe( true );
			expect(
				requests.some( ( request ) =>
					request.startsWith( 'PUT /wp/v2/media/77' )
				)
			).toBe( false );
		} );

		it( 'attaches media the post displays', async () => {
			const requests = [];
			setFetchHandler( requests );

			const registry = createRegistryWithStores();
			setUpEditor( registry );

			await registry.dispatch( editorStore ).savePost();
			await flush();

			expect( hasAttached( requests ) ).toBe( true );
			expect( attachedTo ).toBe( postId );
		} );

		/**
		 * The bug a contributor found: with "Show template" on, the block editor
		 * holds the *template's* tree with the post nested inside a
		 * `core/post-content` block, so reading the canvas picked up the
		 * template's media and attached it to the post.
		 */
		it( "ignores media in the canvas that is not the post's own", async () => {
			const requests = [];
			setFetchHandler( requests );

			const registry = createRegistryWithStores();
			setUpEditor( registry );

			// The canvas as template mode leaves it: an image belonging to the
			// template, alongside the post's content.
			registry.dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId: 'template-image',
					name: 'core/image',
					isValid: true,
					attributes: { id: 99 },
					innerBlocks: [],
				},
				{
					clientId: 'post-content',
					name: 'core/post-content',
					isValid: true,
					attributes: {},
					innerBlocks: [
						{
							clientId: 'image-1',
							name: 'core/image',
							isValid: true,
							attributes: { id: 12 },
							innerBlocks: [],
						},
					],
				},
			] );

			await registry.dispatch( editorStore ).savePost();
			await flush();

			// The post's own image, and only that.
			expect( hasAttached( requests ) ).toBe( true );
			expect(
				requests.some( ( request ) =>
					request.startsWith( 'PUT /wp/v2/media/99' )
				)
			).toBe( false );
		} );

		it( 'attaches nothing when the editor setting is off', async () => {
			const requests = [];
			setFetchHandler( requests );

			const registry = createRegistryWithStores();
			registry
				.dispatch( editorStore )
				.updateEditorSettings( { autoAttachMediaEnabled: false } );
			setUpEditor( registry );

			await registry.dispatch( editorStore ).savePost();
			await flush();

			expect( hasAttached( requests ) ).toBe( false );
		} );

		/**
		 * `trashPost` deletes the post and then calls `savePost`, and
		 * `isEditedPostSaveable` has no status check to stop it — so without a
		 * guard a post on its way to the bin would claim media on the way out.
		 */
		it( 'attaches nothing while the post is being trashed', async () => {
			const requests = [];
			setFetchHandler( requests );

			const registry = createRegistryWithStores();
			setUpEditor( registry );

			await registry.dispatch( editorStore ).trashPost();
			await flush();

			expect( hasAttached( requests ) ).toBe( false );
		} );

		it( 'attaches nothing on an autosave', async () => {
			const requests = [];
			setFetchHandler( requests );

			const registry = createRegistryWithStores();
			setUpEditor( registry );

			await registry
				.dispatch( editorStore )
				.savePost( { isAutosave: true } );
			await flush();

			expect( hasAttached( requests ) ).toBe( false );
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
