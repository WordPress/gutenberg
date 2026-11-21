import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';
import type * as ET from '../entity-types';

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

	/**
	 * Holds the next record request until the test delivers its response.
	 *
	 * @return Promise settling once the request is made, and the response's
	 *         delivery function.
	 */
	function holdNextResponse(): {
		requested: Promise< unknown >;
		deliver: ( record: unknown ) => void;
	} {
		let deliver!: ( record: unknown ) => void;
		let onRequest!: ( value?: unknown ) => void;
		const gate = new Promise( ( resolve ) => {
			deliver = resolve;
		} );
		const requested = new Promise( ( resolve ) => {
			onRequest = resolve;
		} );
		apiFetchMock.mockImplementationOnce( () => {
			onRequest();
			return {
				json: () => gate,
				headers: { get: () => null },
			};
		} );
		return { requested, deliver };
	}

	/**
	 * Registers entities without a config loader, so that only record
	 * requests reach the REST API mock.
	 */
	function addLoaderlessEntities() {
		registry.dispatch( coreDataStore ).addEntities( [
			{
				kind: 'test',
				name: 'post',
				baseURL: '/wp/v2/posts',
			},
			{
				kind: 'test',
				name: 'settings',
				key: false,
				baseURL: '/wp/v2/settings',
			},
		] );
	}

	it( 'keeps a full response when only some fields were received during the request', async () => {
		addLoaderlessEntities();
		const { receiveEntityRecords, invalidateResolution } =
			registry.dispatch( coreDataStore );
		receiveEntityRecords( 'test', 'post', createTestPost( 1 ) );

		const { requested, deliver } = holdNextResponse();
		invalidateResolution( 'getEntityRecord', [ 'test', 'post', 1 ] );
		const request = registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1 );
		await requested;

		// A `_fields` list lands while the full request is in flight.
		receiveEntityRecords(
			'test',
			'post',
			[ { id: 1, title: { raw: 'Renamed', rendered: 'Renamed' } } ],
			{ _fields: 'id,title' }
		);

		const fullPost = {
			...createTestPost( 1 ),
			title: { raw: 'Renamed', rendered: 'Renamed' },
			content: { raw: 'Updated', rendered: 'Updated' },
		};
		deliver( fullPost );
		await request;

		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'test', 'post', 1 )
		).toEqual( fullPost );
	} );

	it( 'keeps a response when a list holding the record was fetched during the request', async () => {
		addLoaderlessEntities();

		const { requested, deliver } = holdNextResponse();
		const request = registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1 );
		await requested;

		// A list read before the record changed lands first.
		apiFetchMock.mockImplementationOnce( () => ( {
			json: () => Promise.resolve( [ createTestPost( 1 ) ] ),
			headers: { get: () => null },
		} ) );
		await registry
			.resolveSelect( coreDataStore )
			.getEntityRecords( 'test', 'post', { per_page: 10 } );

		const updatedPost = {
			...createTestPost( 1 ),
			content: { raw: 'Updated', rendered: 'Updated' },
		};
		deliver( updatedPost );
		await request;

		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'test', 'post', 1 )
		).toEqual( updatedPost );
		expect( triggerFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'requests a keyless record again when it was received directly during the request', async () => {
		addLoaderlessEntities();

		const { requested, deliver } = holdNextResponse();
		const request = registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'settings' );
		await requested;

		// The settings are received directly while the read is in flight.
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'test', 'settings', { title: 'Saved' } );

		apiFetchMock.mockImplementationOnce( () => ( {
			json: () => Promise.resolve( { title: 'Saved' } ),
			headers: { get: () => null },
		} ) );
		deliver( { title: 'Stale' } );
		await request;

		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'test', 'settings' )
		).toEqual( { title: 'Saved' } );
		expect( triggerFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'requests the record again after a direct receipt, even when another request wrote it since', async () => {
		addLoaderlessEntities();
		const savedPost = {
			...createTestPost( 1 ),
			content: { raw: 'Saved', rendered: 'Saved' },
		};

		const { requested, deliver: deliverStale } = holdNextResponse();
		const embedRequest = registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1, { _embed: true } );
		await requested;

		// The record is received directly, then read by another request,
		// while the first one is still in flight.
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'test', 'post', savedPost );
		apiFetchMock.mockImplementationOnce( () => ( {
			json: () => Promise.resolve( savedPost ),
			headers: { get: () => null },
		} ) );
		registry
			.dispatch( coreDataStore )
			.invalidateResolution( 'getEntityRecord', [ 'test', 'post', 1 ] );
		await registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1 );

		const embeddedPost = { ...savedPost, _embedded: { author: [] } };
		apiFetchMock.mockImplementationOnce( () => ( {
			json: () => Promise.resolve( embeddedPost ),
			headers: { get: () => null },
		} ) );
		deliverStale( { ...createTestPost( 1 ), _embedded: { author: [] } } );
		await embedRequest;

		// The late response is not stored, and the embedded data it was
		// requested for still arrives.
		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'test', 'post', 1, { _embed: true } )
		).toEqual( embeddedPost );
		expect( triggerFetch ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'ignores a late response to the same query with its keys in another order', async () => {
		addLoaderlessEntities();
		const { requested: requestedStale, deliver: deliverStale } =
			holdNextResponse();
		const staleRequest = registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1, {
				context: 'view',
				_fields: 'id,title',
			} );
		await requestedStale;

		apiFetchMock.mockImplementationOnce( () => ( {
			json: () => Promise.resolve( { id: 1, title: 'Fresh' } ),
			headers: { get: () => null },
		} ) );
		registry
			.dispatch( coreDataStore )
			.invalidateResolution( 'getEntityRecord', [
				'test',
				'post',
				1,
				{ context: 'view', _fields: 'id,title' },
			] );
		await registry
			.resolveSelect( coreDataStore )
			.getEntityRecord( 'test', 'post', 1, {
				_fields: 'title,id',
				context: 'view',
			} );

		deliverStale( { id: 1, title: 'Stale' } );
		await staleRequest;

		expect(
			registry
				.select( coreDataStore )
				.getEntityRecord( 'test', 'post', 1, {
					context: 'view',
					_fields: 'id,title',
				} )
		).toEqual( { id: 1, title: 'Fresh' } );
		expect( triggerFetch ).toHaveBeenCalledTimes( 2 );
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
