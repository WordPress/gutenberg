/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../sync', () => ( {
	...jest.requireActual( '../sync' ),
	getSyncManager: jest.fn(),
} ) );
jest.mock( '../utils/crdt', () => ( {
	...jest.requireActual( '../utils/crdt' ),
	applyPostChangesToCRDTDoc: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import {
	getMethodName,
	rootEntitiesConfig,
	prePersistPostType,
	additionalEntityConfigLoaders,
} from '../entities';
import { getSyncManager } from '../sync';
import {
	applyPostChangesToCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from '../utils/crdt';

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
		rootEntitiesConfig[ id ] = { name: 'book', kind: 'postType' };
		const methodName = getMethodName( 'postType', 'book' );
		delete rootEntitiesConfig[ id ];

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );

describe( 'prePersistPostType', () => {
	it( 'set the status to draft and empty the title when saving auto-draft posts', async () => {
		let record = {
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

	it( 'adds meta with serialized CRDT doc when createPersistedCRDTDoc returns a value', async () => {
		const mockSerializedDoc = 'serialized-crdt-doc-data';
		getSyncManager.mockReturnValue( {
			createPersistedCRDTDoc: jest
				.fn()
				.mockReturnValue( mockSerializedDoc ),
		} );

		const record = { id: 123, status: 'publish' };
		const edits = {};
		const result = await prePersistPostType( record, edits, 'post', false );

		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: mockSerializedDoc,
		} );

		expect( getSyncManager ).toHaveBeenCalled();
		expect( getSyncManager().createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123
		);

		getSyncManager.mockReset();
	} );
} );

describe( 'loadPostTypeEntities', () => {
	let originalCollaborationEnabled;

	beforeEach( () => {
		apiFetch.mockReset();
		applyPostChangesToCRDTDoc.mockReset();
		originalCollaborationEnabled = window._wpCollaborationEnabled;
	} );

	afterEach( () => {
		window._wpCollaborationEnabled = originalCollaborationEnabled;
	} );

	it( 'should include custom taxonomy rest_bases in synced properties when collaboration is enabled', async () => {
		window._wpCollaborationEnabled = true;

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

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = entities.find( ( e ) => e.name === 'book' );

		bookEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		expect( applyPostChangesToCRDTDoc ).toHaveBeenCalledWith(
			{},
			{},
			expect.any( Set )
		);

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		expect( syncedProperties ).toContain( 'audiences' );
	} );

	it( 'should not fetch taxonomies when collaboration is disabled', async () => {
		window._wpCollaborationEnabled = false;

		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'category', 'post_tag' ],
			},
		};

		apiFetch.mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const postEntity = entities.find( ( e ) => e.name === 'post' );

		postEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		// Only one apiFetch call (post types), no taxonomy fetch.
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).not.toContain( 'categories' );
		expect( syncedProperties ).not.toContain( 'tags' );
	} );

	it( 'should skip taxonomy rest_base when taxonomy is not found in fetched taxonomies', async () => {
		window._wpCollaborationEnabled = true;

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

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = entities.find( ( e ) => e.name === 'book' );

		bookEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		// missing_taxonomy has no rest_base entry, so nothing should be added for it.
		expect( syncedProperties.size ).toBe( 16 ); // 15 base + 1 taxonomy (genres)
	} );

	it( 'should include base synced properties regardless of taxonomies', async () => {
		window._wpCollaborationEnabled = true;

		const mockPostTypes = {
			page: {
				name: 'Pages',
				rest_base: 'pages',
				rest_namespace: 'wp/v2',
				taxonomies: [],
			},
		};

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( {} );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const pageEntity = entities.find( ( e ) => e.name === 'page' );

		pageEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
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
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'should add supportsPagination: true to taxonomy entities', async () => {
		const mockTaxonomies = {
			category: {
				name: 'Categories',
				rest_base: 'categories',
			},
		};

		apiFetch.mockResolvedValueOnce( mockTaxonomies );

		const taxonomyLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'taxonomy'
		);
		const entities = await taxonomyLoader.loadEntities();

		expect( entities[ 0 ].supportsPagination ).toBe( true );
	} );
} );
