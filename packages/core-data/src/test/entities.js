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
		expect( prePersistPostType( record, edits, 'post', false ) ).toEqual( {
			status: 'draft',
			title: '',
			meta: {},
		} );

		record = {
			status: 'publish',
		};
		expect( prePersistPostType( record, edits, 'post', false ) ).toEqual( {
			meta: {},
		} );

		record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		expect( prePersistPostType( record, edits, 'post', false ) ).toEqual( {
			status: 'draft',
			title: '',
			meta: {},
		} );

		record = {
			status: 'publish',
			title: 'My Title',
		};
		expect( prePersistPostType( record, edits, 'post', false ) ).toEqual( {
			meta: {},
		} );
	} );

	it( 'does not set the status to draft and empty the title when saving templates', () => {
		const record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		const edits = {};
		expect( prePersistPostType( record, edits, 'post', true ) ).toEqual( {
			meta: {},
		} );
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
