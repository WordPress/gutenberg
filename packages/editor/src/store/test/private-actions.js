/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '..';
import { unlock } from '../../lock-unlock';

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

const postId = 44;

const post = {
	id: postId,
	type: 'post',
	title: 'bar',
	content: 'bar',
	excerpt: 'crackers',
	status: 'draft',
};

const postEntityRecord = {
	key: postId,
	kind: 'postType',
	name: 'post',
	title: 'bar',
};

function createRegistryWithStoresAndEditedPost() {
	const registry = createRegistry();

	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );

	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'postType', 'post', post );

	registry.dispatch( editorStore ).setupEditor( post, {
		content: 'new bar',
	} );

	return registry;
}

const getMethod = ( options ) =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

describe( 'Editor private actions', () => {
	describe( 'saveDirtyEntities', () => {
		it( 'saves modified entities', async () => {
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path, data } = options;

				if (
					method === 'PUT' &&
					path.startsWith( `/wp/v2/posts/${ postId }` )
				) {
					return { ...post, ...data };
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStoresAndEditedPost();

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{
					dirtyEntityRecords: [ postEntityRecord ],
				}
			);

			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				false
			);

			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'Site updated.',
				},
			] );
		} );

		it( 'shows a notice to convey errors', async () => {
			apiFetch.setFetchHandler( async ( options ) => {
				const method = getMethod( options );
				const { path } = options;

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ method } ${ path }`,
				};
			} );

			const registry = createRegistryWithStoresAndEditedPost();

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			const content = registry
				.select( editorStore )
				.getEditedPostContent();
			expect( content ).toBe( 'new bar' );

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			const notices = registry.select( noticesStore ).getNotices();
			expect( notices[ 0 ].status ).toBe( 'error' );
			expect( notices[ 0 ].content ).toMatch( /^Unknown path/ );
		} );

		it( 'derives error messages depending on failure scenario', async () => {
			const registry = createRegistryWithStoresAndEditedPost();

			// Throw an object with a `message` property
			apiFetch.setFetchHandler( async () => {
				throw {
					message: 'Lorem ipsum',
				};
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Lorem ipsum',
			} );

			// Throw an object with an empty `message` property
			apiFetch.setFetchHandler( async () => {
				throw {
					message: '',
				};
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Saving failed.',
			} );

			// Throw an actual error
			apiFetch.setFetchHandler( async () => {
				throw new Error( 'Dolor sit amet' );
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Dolor sit amet',
			} );

			// Throw a string
			apiFetch.setFetchHandler( async () => {
				throw 'Consectetur adipiscing elit';
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Consectetur adipiscing elit',
			} );

			// Throw an object implementing `toString`
			apiFetch.setFetchHandler( async () => {
				throw {
					toString() {
						return 'Sed do eiusmod tempor incididunt';
					},
				};
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Sed do eiusmod tempor incididunt',
			} );

			// Throw something with no clear message
			apiFetch.setFetchHandler( async () => {
				throw {};
			} );

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{ dirtyEntityRecords: [ postEntityRecord ] }
			);

			expect(
				registry.select( noticesStore ).getNotices().at( -1 )
			).toMatchObject( {
				status: 'error',
				content: 'Saving failed.',
			} );
		} );

		it( 'aborts if `onSave` fails', async () => {
			apiFetch.setFetchHandler( async () => {
				throw {
					code: 'unknown_path',
					message: 'Unknown path',
				};
			} );

			const registry = createRegistryWithStoresAndEditedPost();

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{
					dirtyEntityRecords: [ postEntityRecord ],
					async onSave() {
						throw new Error( 'oh no' );
					},
				}
			);

			expect( registry.select( editorStore ).isEditedPostDirty() ).toBe(
				true
			);

			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'error',
					content: 'oh no',
				},
			] );
		} );

		it( 'honors the `successNoticeContent` prop', async () => {
			apiFetch.setFetchHandler( async ( options ) => {
				const { data } = options;
				return { ...post, ...data };
			} );

			const registry = createRegistryWithStoresAndEditedPost();

			await unlock( registry.dispatch( editorStore ) ).saveDirtyEntities(
				{
					dirtyEntityRecords: [ postEntityRecord ],
					successNoticeContent: 'eureka',
				}
			);

			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					status: 'success',
					content: 'eureka',
				},
			] );
		} );
	} );
} );
