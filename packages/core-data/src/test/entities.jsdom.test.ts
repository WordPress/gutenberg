import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import type { CRDTDoc } from '@wordpress/sync';
import {
	getMethodName,
	rootEntitiesConfig,
	prePersistPostType,
	additionalEntityConfigLoaders,
} from '../entities';
import { applyPostChangesToCRDTDoc } from '../utils/crdt';
import type { EntityConfig } from '../types';

/**
 * Finds an item the test expects, such as a loader or an entity.
 *
 * @param items     The items to search.
 * @param predicate Whether an item is the one the test expects.
 */
function findExpected< T >(
	items: ReadonlyArray< T >,
	predicate: ( item: T ) => boolean
): T {
	// The tests look up only items that exist.
	return items.find( predicate )!;
}

// The mocked CRDT functions never read the document.
const CRDT_DOC = {} as CRDTDoc;
vi.mock( import( '@wordpress/api-fetch' ) );
vi.mock( import( '../utils/crdt' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	applyPostChangesToCRDTDoc: vi.fn(),
} ) );

describe( 'getMethodName', () => {
	it( 'should return the right method name for an entity with the root kind', () => {
		const methodName = getMethodName( 'root', 'postType' );

		expect( methodName ).toEqual( 'getPostType' );
	} );

	it( 'should use a different suffix', () => {
		const methodName = getMethodName( 'root', 'postType', 'set' );

		expect( methodName ).toEqual( 'setPostType' );
	} );

	it( 'should use the given plural form', () => {
		const methodName = getMethodName( 'root', 'taxonomies', 'get' );

		expect( methodName ).toEqual( 'getTaxonomies' );
	} );

	it( 'should include the kind in the method name', () => {
		const id = rootEntitiesConfig.length;
		// The method name reads only the name and kind.
		rootEntitiesConfig[ id ] = {
			name: 'book',
			kind: 'postType',
		} as EntityConfig;
		const methodName = getMethodName( 'postType', 'book' );
		delete rootEntitiesConfig[ id ];

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );

describe( 'rootEntitiesConfig', () => {
	it( 'does not define sync configuration when collaboration is disabled', () => {
		const commentEntity = findExpected(
			rootEntitiesConfig,
			( entity ) => entity.name === 'comment'
		);

		expect( commentEntity.syncConfig ).toBeUndefined();
	} );
} );

describe( 'prePersistPostType', () => {
	let originalCollaborationEnabled: boolean | undefined;

	beforeEach( () => {
		originalCollaborationEnabled =
			window.__experimentalEnableRealTimeCollaboration;
	} );

	afterEach( () => {
		window.__experimentalEnableRealTimeCollaboration =
			originalCollaborationEnabled;
	} );

	it( 'set the status to draft and empty the title when saving auto-draft posts', async () => {
		let record: Record< string, unknown > = {
			status: 'auto-draft',
		};
		const edits = {};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {} );

		record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
			title: 'My Title',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {} );
	} );

	it( 'does not set the status to draft and empty the title when saving templates', async () => {
		const record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		const edits = {};
		expect(
			await prePersistPostType( record, edits, 'post', true )
		).toEqual( {} );
	} );
} );

describe( 'loadPostTypeEntities', () => {
	let originalCollaborationEnabled: boolean | undefined;
	let originalCollaborationDisabledPostTypes: unknown;

	beforeEach( () => {
		vi.mocked( apiFetch ).mockReset();
		vi.mocked( applyPostChangesToCRDTDoc ).mockReset();
		originalCollaborationEnabled =
			window.__experimentalEnableRealTimeCollaboration;
		originalCollaborationDisabledPostTypes =
			window._wpCollaborationDisabledPostTypes;
	} );

	afterEach( () => {
		window.__experimentalEnableRealTimeCollaboration =
			originalCollaborationEnabled;
		window._wpCollaborationDisabledPostTypes =
			originalCollaborationDisabledPostTypes;
	} );

	it( 'should include custom taxonomy rest_bases in synced properties when collaboration is enabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'genre', 'audience' ],
			},
		};
		const mockTaxonomies = {
			genre: {
				name: 'Genres',
				rest_base: 'genres',
				rest_namespace: 'wp/v2',
			},
			audience: {
				name: 'Audiences',
				rest_base: 'audiences',
				rest_namespace: 'wp/v2',
			},
		};

		vi.mocked( apiFetch )
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = findExpected( entities, ( e ) => e.name === 'book' );

		// Collaboration is enabled, so the entity has a sync config.
		bookEntity.syncConfig!.applyChangesToCRDTDoc( CRDT_DOC, {} );

		expect( applyPostChangesToCRDTDoc ).toHaveBeenCalledWith(
			{},
			{},
			expect.any( Set )
		);

		const syncedProperties = vi.mocked( applyPostChangesToCRDTDoc ).mock
			.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		expect( syncedProperties ).toContain( 'audiences' );
	} );

	it( 'should not fetch taxonomies when collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = false;

		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'category', 'post_tag' ],
			},
		};

		vi.mocked( apiFetch ).mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		await postTypeLoader.loadEntities();

		// Only one apiFetch call (post types), no taxonomy fetch.
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not define sync configuration when collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = false;

		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
			},
		};

		vi.mocked( apiFetch ).mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const postEntity = findExpected( entities, ( e ) => e.name === 'post' );

		expect( postEntity.syncConfig ).toBeUndefined();
	} );

	it( 'should not sync post type entities disabled for collaboration', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		window._wpCollaborationDisabledPostTypes = [ 'book' ];

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
			},
		};

		vi.mocked( apiFetch ).mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = findExpected( entities, ( e ) => e.name === 'book' );

		// Collaboration is enabled, so the post type syncs and has a sync check.
		expect(
			// @ts-expect-error The post type check ignores the object it is given.
			bookEntity.syncConfig!.shouldSync!()
		).toBe( false );
	} );

	it( 'should skip taxonomy rest_base when taxonomy is not found in fetched taxonomies', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'genre', 'missing_taxonomy' ],
			},
		};
		const mockTaxonomies = {
			genre: {
				name: 'Genres',
				rest_base: 'genres',
				rest_namespace: 'wp/v2',
			},
			// 'missing_taxonomy' is intentionally absent.
		};

		vi.mocked( apiFetch )
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = findExpected( entities, ( e ) => e.name === 'book' );

		// Collaboration is enabled, so the entity has a sync config.
		bookEntity.syncConfig!.applyChangesToCRDTDoc( CRDT_DOC, {} );

		const syncedProperties = vi.mocked( applyPostChangesToCRDTDoc ).mock
			.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		// missing_taxonomy has no rest_base entry, so nothing should be added for it.
		expect( syncedProperties.size ).toBe( 16 ); // 15 base + 1 taxonomy (genres)
	} );

	it( 'should include base synced properties regardless of taxonomies', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;

		const mockPostTypes = {
			page: {
				name: 'Pages',
				rest_base: 'pages',
				rest_namespace: 'wp/v2',
				taxonomies: [],
			},
		};

		vi.mocked( apiFetch )
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( {} );

		const postTypeLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const pageEntity = findExpected( entities, ( e ) => e.name === 'page' );

		// Collaboration is enabled, so the entity has a sync config.
		pageEntity.syncConfig!.applyChangesToCRDTDoc( CRDT_DOC, {} );

		const syncedProperties = vi.mocked( applyPostChangesToCRDTDoc ).mock
			.calls[ 0 ][ 2 ];
		const expectedBase = [
			'author',
			'blocks',
			'content',
			'comment_status',
			'date',
			'excerpt',
			'featured_media',
			'format',
			'meta',
			'ping_status',
			'slug',
			'status',
			'sticky',
			'template',
			'title',
		];
		for ( const prop of expectedBase ) {
			expect( syncedProperties ).toContain( prop );
		}
		expect( syncedProperties.size ).toBe( 15 );
	} );
} );

describe( 'loadTaxonomyEntities', () => {
	let originalCollaborationEnabled: boolean | undefined;

	beforeEach( () => {
		vi.mocked( apiFetch ).mockReset();
		originalCollaborationEnabled =
			window.__experimentalEnableRealTimeCollaboration;
	} );

	afterEach( () => {
		window.__experimentalEnableRealTimeCollaboration =
			originalCollaborationEnabled;
	} );

	it( 'should add supportsPagination: true to taxonomy entities', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const mockTaxonomies = {
			category: {
				name: 'Categories',
				rest_base: 'categories',
			},
		};

		vi.mocked( apiFetch ).mockResolvedValueOnce( mockTaxonomies );

		const taxonomyLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'taxonomy'
		);
		const entities = await taxonomyLoader.loadEntities();

		expect( entities[ 0 ].supportsPagination ).toBe( true );
		expect( entities[ 0 ].syncConfig ).toBeDefined();
	} );

	it( 'does not define sync configuration when collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = false;
		vi.mocked( apiFetch ).mockResolvedValueOnce( {
			category: {
				name: 'Categories',
				rest_base: 'categories',
			},
		} );

		const taxonomyLoader = findExpected(
			additionalEntityConfigLoaders,
			( loader ) => loader.kind === 'taxonomy'
		);
		const entities = await taxonomyLoader.loadEntities();

		expect( entities[ 0 ].syncConfig ).toBeUndefined();
	} );
} );
