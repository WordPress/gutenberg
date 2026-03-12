/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../index';

jest.mock( '@wordpress/api-fetch' );

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
		getRevisionsUrl: ( parentId, revisionId ) =>
			`/wp/v2/posts/${ parentId }/revisions${
				revisionId ? '/' + revisionId : ''
			}`,
	};

	// Add the post entity to the store
	registry.dispatch( coreDataStore ).addEntities( [ postEntityConfig ] );

	return registry;
}

function createTestPost( id = 1, fields = [] ) {
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
		return Object.fromEntries(
			fields.map( ( field ) => [ field, post[ field ] ] )
		);
	}

	return post;
}

describe( 'getEntityRecord', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'should not make a request if the record is already in store', async () => {
		const { getEntityRecord } = registry.resolveSelect( coreDataStore );
		const post = createTestPost( 1 );
		triggerFetch.mockResolvedValue( {
			async json() {
				return post;
			},
		} );

		// Resolve the record.
		await expect(
			getEntityRecord( 'postType', 'post', post.id, { context: 'edit' } )
		).resolves.toEqual( post );

		triggerFetch.mockReset();

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
} );

describe( 'getEntityRecords', () => {
	const POSTS = [
		createTestPost( 1 ),
		createTestPost( 2 ),
		createTestPost( 3 ),
	];

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'preserves collection when getEntityRecord resolves after getEntityRecords', async () => {
		let resolveSlowFetch;
		const slowFetchPromise = new Promise( ( resolve ) => {
			resolveSlowFetch = resolve;
		} );

		triggerFetch.mockImplementation( ( { path } ) => {
			// Single post fetch (e.g. /wp/v2/posts/1): return slow promise.
			if ( /\/wp\/v2\/posts\/\d+/.test( path ) ) {
				return slowFetchPromise;
			}
			// Collection fetch: return immediately.
			return Promise.resolve( {
				json: () => Promise.resolve( POSTS ),
				headers: {
					get: ( header ) => {
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
		expect( allPosts.map( ( p ) => p.id ) ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'preserves collection when getEntityRecord is called after getEntityRecords', async () => {
		triggerFetch.mockImplementation( ( { path } ) => {
			// Collection fetch.
			if ( ! /\/wp\/v2\/posts\/\d+/.test( path ) ) {
				return Promise.resolve( {
					json: () => Promise.resolve( POSTS ),
					headers: {
						get: ( header ) => {
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
		expect( allPosts.map( ( p ) => p.id ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'clearEntityRecordEdits', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'should return the persisted record after clearing edits', () => {
		const post = createTestPost( 1 );
		const dispatch = registry.dispatch( coreDataStore );
		const select = registry.select( coreDataStore );

		dispatch.receiveEntityRecords( 'postType', 'post', post );
		dispatch.editEntityRecord( 'postType', 'post', post.id, {
			slug: 'updated-slug',
		} );

		expect(
			select.getEditedEntityRecord( 'postType', 'post', post.id ).slug
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

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		triggerFetch.mockReset();
	} );

	it( 'preserves all revisions when getRevision resolves after getRevisions', async () => {
		let resolveSlowFetch;
		const slowFetchPromise = new Promise( ( resolve ) => {
			resolveSlowFetch = resolve;
		} );

		triggerFetch.mockImplementation( ( { path } ) => {
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
		await resolveSelectStore.getRevisions( KIND, NAME, RECORD_KEY, {
			context: 'edit',
		} );

		// Now resolve the slow single-revision fetch.
		resolveSlowFetch( REVISIONS[ 0 ] );
		await revisionPromise;

		// Wait for all pending thunks (receiveRevisions) to settle.
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		const allRevisions = registry
			.select( coreDataStore )
			.getRevisions( KIND, NAME, RECORD_KEY, { context: 'edit' } );
		expect( allRevisions.map( ( r ) => r.id ) ).toEqual( [ 2, 3, 4 ] );
	} );
} );
