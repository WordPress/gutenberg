/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import {
	getMethodName,
	rootEntitiesConfig,
	prePersistPostType,
	additionalEntityConfigLoaders,
} from '../entities';

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
	it( 'set the status to draft and empty the title when saving auto-draft posts', () => {
		let record = {
			status: 'auto-draft',
		};
		const edits = {};
		expect( prePersistPostType( record, edits ) ).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
		};
		expect( prePersistPostType( record, edits ) ).toEqual( {} );

		record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		expect( prePersistPostType( record, edits ) ).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
			title: 'My Title',
		};
		expect( prePersistPostType( record, edits ) ).toEqual( {} );
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

describe( 'loadPostTypeEntities', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'should add required properties to post type entities', async () => {
		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
				slug: 'post',
				supports: {
					'custom-fields': true,
					editor: true,
					'collaborative-editing': true,
				},
			},
		};

		apiFetch.mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();

		expect( entities[ 0 ].supportsPagination ).toBe( true );
		expect( entities[ 0 ].transientEdits ).toEqual( {
			blocks: true,
			selection: true,
		} );
		expect( entities[ 0 ].mergedEdits ).toEqual( { meta: true } );
		expect( entities[ 0 ].rawAttributes ).toBeDefined();
		expect( entities[ 0 ].__unstable_rest_base ).toBe( 'posts' );
		expect( entities[ 0 ].syncConfig ).toBeDefined();
		expect( entities[ 0 ].syncConfig.enabled ).toBe( true );
		expect( typeof entities[ 0 ].syncConfig.applyChangesToCRDTDoc ).toBe(
			'function'
		);
		expect( typeof entities[ 0 ].syncConfig.getChangesFromCRDTDoc ).toBe(
			'function'
		);
		expect( typeof entities[ 0 ].syncConfig.getInitialObjectData ).toBe(
			'function'
		);
		expect( typeof entities[ 0 ].syncConfig.getObjectId ).toBe(
			'function'
		);
		expect( entities[ 0 ].syncConfig.objectType ).toBe( 'postType/post' );
		expect( entities[ 0 ].syncConfig.supports ).toEqual( {
			awareness: true,
			crdtPersistence: true,
			undo: true,
		} );
		expect( entities[ 0 ].syncConfig.syncedProperties ).toBeDefined();
		expect( typeof entities[ 0 ].getRevisionsUrl ).toBe( 'function' );
		expect( entities[ 0 ].revisionKey ).toBe( 'id' );
	} );
} );
