import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { additionalEntityConfigLoaders } from '../entities';
import { store as coreDataStore } from '../index';
import type * as ET from '../entity-types';
import { unlock } from '../lock-unlock';

vi.mock( import( '@wordpress/api-fetch' ) );

// The tests stub REST responses in place of typed requests.
const apiFetchMock = triggerFetch as unknown as Mock<
	( options: { path: string; parse?: boolean } ) => unknown
>;

function createTestRegistry() {
	const registry = createRegistry();

	// Register the core-data store
	registry.register( coreDataStore );

	const postEntityConfig = {
		kind: 'postType',
		baseURL: '/wp/v2/posts',
		baseURLParams: {
			context: 'edit',
		},
		name: 'post',
		label: 'Posts',
		transientEdits: {
			blocks: true,
			selection: true,
		},
		mergedEdits: {
			meta: true,
		},
		rawAttributes: [ 'title', 'excerpt', 'content' ],
		__unstable_rest_base: 'posts',
		supportsPagination: true,
		revisionKey: 'id',
		getRevisionsUrl: (
			parentId: string | number,
			revisionId?: string | number
		) =>
			`/wp/v2/posts/${ parentId }/revisions${
				revisionId ? '/' + revisionId : ''
			}`,
	};

	// Add the post entity to the store
	registry.dispatch( coreDataStore ).addEntities( [ postEntityConfig ] );

	return registry;
}

function createTestPost( id = 1, fields: Array< string > = [] ) {
	const post = {
		id,
		author: 1,
		content: {
			raw: '<!-- wp:paragraph -->\n<p>A paragraph</p>\n<!-- /wp:paragraph -->',
			rendered: '\n<p>A paragraph</p>\n',
		},
		excerpt: {
			raw: '',
			rendered: '<p>A paragraph</p>\n',
		},
		title: {
			raw: 'Test',
			rendered: 'Test',
		},
		featured_media: 0,
		type: 'post',
		status: 'draft',
		slug: '',
	};

	if ( fields.length > 0 ) {
		// The tests read the subset of fields as the post they come from.
		return Object.fromEntries(
			fields.map( ( field ) => [
				field,
				// The tests ask for fields the post has.
				post[ field as keyof typeof post ],
			] )
		) as typeof post;
	}

	return post;
}

describe( 'getEntityRecord', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it( 'should not make a request if the record is already in store', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const post = createTestPost( 1 );
		apiFetchMock.mockResolvedValue( {
			async json() {
				return post;
			},
		} );

		// Resolve the record.
		await expect(
			getEntityRecord( 'postType', 'post', post.id, { context: 'edit' } )
		).resolves.toEqual( post );

		apiFetchMock.mockReset();

		await expect(
			getEntityRecord( 'postType', 'post', post.id, {
				context: 'edit',
				_fields: [ 'id', 'author', 'title' ],
			} )
		).resolves.toEqual( {
			id: post.id,
			author: post.author,
			title: post.title,
		} );
		expect( triggerFetch ).not.toHaveBeenCalled();
	} );

	it( 'does not wait for the site entity config to resolve other root entities', async () => {
		const widget = { name: 'core/stats' };
		apiFetchMock.mockImplementation( ( { path } ) =>
			path.startsWith( '/wp/v2/settings' )
				? new Promise( () => {} )
				: Promise.resolve( {
						async json() {
							return widget;
						},
					} )
		);

		const { getEntityConfig, getEntityRecord } =
			registry.resolveSelect( coreDataStore );
		await expect(
			getEntityConfig( 'root', 'widgetModule' )
		).resolves.toBeUndefined();

		registry.dispatch( coreDataStore ).addEntities( [
			{
				kind: 'root',
				name: 'widgetModule',
				key: 'name',
				baseURL: '/wp/v2/widget-modules',
			},
		] );

		await expect(
			getEntityRecord( 'root', 'widgetModule', 'core/stats' )
		).resolves.toEqual( widget );
	} );
} );

describe( 'getEntityConfig', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it( 'loads the site entity config with the setting labels', async () => {
		apiFetchMock.mockResolvedValue( {
			schema: { properties: { title: { title: 'Title' } } },
		} );

		await expect(
			registry
				.resolveSelect( coreDataStore )
				.getEntityConfig( 'root', 'site' )
		).resolves.toMatchObject( { meta: { labels: { title: 'Title' } } } );
	} );

	it( 'loads each named loader of a kind', async () => {
		const userConfig = { kind: 'root', name: 'testUser', baseURL: '/' };
		const loader = {
			kind: 'root',
			name: 'testUser',
			loadEntities: async () => [ userConfig ],
		};
		additionalEntityConfigLoaders.push( loader );
		apiFetchMock.mockResolvedValue( {} );

		try {
			const { getEntityConfig } = registry.resolveSelect( coreDataStore );
			await getEntityConfig( 'root', 'site' );

			await expect(
				getEntityConfig( 'root', 'testUser' )
			).resolves.toEqual( userConfig );
		} finally {
			additionalEntityConfigLoaders.splice(
				additionalEntityConfigLoaders.indexOf( loader ),
				1
			);
		}
	} );
} );

describe( 'getEntityRecords', () => {
	const POSTS = [
		createTestPost( 1 ),
		createTestPost( 2 ),
		createTestPost( 3 ),
	];

	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it( 'preserves collection when getEntityRecord resolves after getEntityRecords', async () => {
		// The promise executor below assigns it synchronously.
		let resolveSlowFetch!: ( value: unknown ) => void;
		const slowFetchPromise = new Promise( ( resolve ) => {
			resolveSlowFetch = resolve;
		} );

		apiFetchMock.mockImplementation( ( { path }: { path: string } ) => {
			// Single post fetch (e.g. /wp/v2/posts/1): return slow promise.
			if ( /\/wp\/v2\/posts\/\d+/.test( path ) ) {
				return slowFetchPromise;
			}
			// Collection fetch: return immediately.
			return Promise.resolve( {
				json: () => Promise.resolve( POSTS ),
				headers: {
					get: ( header: string ) => {
						if ( header === 'X-WP-Total' ) {
							return String( POSTS.length );
						}
						if ( header === 'X-WP-TotalPages' ) {
							return '1';
						}
						return null;
					},
				},
			} );
		} );

		const resolveSelectStore = registry.resolveSelect( coreDataStore );

		// Start getEntityRecord first (slow), then getEntityRecords (fast).
		const singlePromise = resolveSelectStore.getEntityRecord(
			'postType',
			'post',
			1,
			{ context: 'edit' }
		);
		await resolveSelectStore.getEntityRecords( 'postType', 'post', {
			context: 'edit',
		} );

		// Now resolve the slow single-record fetch.
		resolveSlowFetch( {
			json: () => Promise.resolve( POSTS[ 0 ] ),
			headers: { get: () => null },
		} );
		await singlePromise;

		// Wait for all pending thunks to settle.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		const allPosts = registry
			.select( coreDataStore )
			.getEntityRecords( 'postType', 'post', { context: 'edit' } );
		// Resolved above.
		expect( allPosts!.map( ( p ) => p.id ) ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'preserves collection when getEntityRecord is called after getEntityRecords', async () => {
		apiFetchMock.mockImplementation( ( { path }: { path: string } ) => {
			// Collection fetch.
			if ( ! /\/wp\/v2\/posts\/\d+/.test( path ) ) {
				return Promise.resolve( {
					json: () => Promise.resolve( POSTS ),
					headers: {
						get: ( header: string ) => {
							if ( header === 'X-WP-Total' ) {
								return String( POSTS.length );
							}
							if ( header === 'X-WP-TotalPages' ) {
								return '1';
							}
							return null;
						},
					},
				} );
			}
			// Single post fetch.
			return Promise.resolve( {
				json: () => Promise.resolve( POSTS[ 0 ] ),
				headers: { get: () => null },
			} );
		} );

		const resolveSelectStore = registry.resolveSelect( coreDataStore );

		// First resolve the collection.
		await resolveSelectStore.getEntityRecords( 'postType', 'post', {
			context: 'edit',
		} );

		// Then resolve a single record.
		await resolveSelectStore.getEntityRecord( 'postType', 'post', 1, {
			context: 'edit',
		} );

		const allPosts = registry
			.select( coreDataStore )
			.getEntityRecords( 'postType', 'post', { context: 'edit' } );
		// Resolved above.
		expect( allPosts!.map( ( p ) => p.id ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'clearEntityRecordEdits', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it( 'should return the persisted record after clearing edits', () => {
		const post = createTestPost( 1 );
		const dispatch = registry.dispatch( coreDataStore );
		const select = registry.select( coreDataStore );

		dispatch.receiveEntityRecords( 'postType', 'post', post );
		dispatch.finishResolution( 'getEntityRecord', [
			'postType',
			'post',
			post.id,
		] );
		dispatch.editEntityRecord( 'postType', 'post', post.id, {
			slug: 'updated-slug',
		} );

		expect(
			// The edited post is loaded, with its slug.
			(
				select.getEditedEntityRecord(
					'postType',
					'post',
					post.id
				) as unknown as ET.Post
			 ).slug
		).toBe( 'updated-slug' );

		dispatch.clearEntityRecordEdits( 'postType', 'post', post.id );

		expect(
			select.getEditedEntityRecord( 'postType', 'post', post.id )
		).toEqual( select.getRawEntityRecord( 'postType', 'post', post.id ) );
	} );
} );

describe( 'getRevisions', () => {
	const KIND = 'postType';
	const NAME = 'post';
	const RECORD_KEY = 1;
	const REVISIONS = [ { id: 2 }, { id: 3 }, { id: 4 } ];

	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it( 'preserves all revisions when getRevision resolves after getRevisions', async () => {
		const revision = { id: 1 };
		// The promise executor below assigns it synchronously.
		let resolveSlowFetch!: ( value: unknown ) => void;
		const slowFetchPromise = new Promise( ( resolve ) => {
			resolveSlowFetch = resolve;
		} );

		apiFetchMock.mockImplementation( ( { path }: { path: string } ) => {
			if ( path && path.includes( 'revisions' ) ) {
				// Single revision fetch: return slow promise.
				if ( /revisions\/\d+/.test( path ) ) {
					return slowFetchPromise;
				}
				// Collection fetch: return immediately.
				return Promise.resolve( {
					json: () => Promise.resolve( REVISIONS ),
					headers: { get: () => String( REVISIONS.length ) },
				} );
			}
			return Promise.resolve( {} );
		} );

		const resolveSelectStore = registry.resolveSelect( coreDataStore );

		// Start getRevision first (slow), then getRevisions (fast).
		const revisionPromise = resolveSelectStore.getRevision(
			KIND,
			NAME,
			RECORD_KEY,
			1,
			{ context: 'edit' }
		);
		await expect(
			resolveSelectStore.getRevisions( KIND, NAME, RECORD_KEY, {
				context: 'edit',
			} )
		).resolves.toEqual( REVISIONS );

		// Now resolve the slow single-revision fetch.
		resolveSlowFetch( revision );
		await expect( revisionPromise ).resolves.toEqual( revision );

		const allRevisions = registry
			.select( coreDataStore )
			.getRevisions( KIND, NAME, RECORD_KEY, { context: 'edit' } );
		// @ts-expect-error Bug: `getRevisions` is typed as the revisions state, not the revisions it returns.
		expect( allRevisions.map( ( r ) => r.id ) ).toEqual( [ 2, 3, 4 ] );
	} );
} );

describe( 'getRegisteredPostMeta', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		apiFetchMock.mockReset();
	} );

	it.each( [
		[ 'getPostType', [ 'post' ] ],
		[ 'getEntityRecord', [ 'root', 'postType', 'post' ] ],
	] as const )(
		'refetches the registered meta when %s is invalidated',
		async ( selectorName, args ) => {
			let metaProperties: Record< string, unknown > = {
				first_key: { type: 'string' },
			};
			apiFetchMock.mockImplementation( ( options ) => {
				if ( ( options as { method?: string } ).method === 'OPTIONS' ) {
					return Promise.resolve( {
						schema: {
							properties: {
								meta: { properties: metaProperties },
							},
						},
					} );
				}
				return Promise.resolve( {
					json: () =>
						Promise.resolve( { slug: 'post', rest_base: 'posts' } ),
					headers: { get: () => null },
				} );
			} );

			const { getRegisteredPostMeta } = unlock(
				registry.resolveSelect( coreDataStore )
			);
			await expect( getRegisteredPostMeta( 'post' ) ).resolves.toEqual(
				metaProperties
			);

			metaProperties = {
				first_key: { type: 'string' },
				second_key: { type: 'string' },
			};
			registry
				.dispatch( coreDataStore )
				.invalidateResolution( selectorName, [ ...args ] );

			await expect( getRegisteredPostMeta( 'post' ) ).resolves.toEqual(
				metaProperties
			);
		}
	);
} );
