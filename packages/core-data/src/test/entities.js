/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import {
	getMethodName,
	rootEntitiesConfig,
	getOrLoadEntitiesConfig,
	prePersistPostType,
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

describe( 'getKindEntities', () => {
	beforeEach( async () => {
		triggerFetch.mockReset();
	} );

	it( 'shouldn’t do anything if the entities have already been resolved', async () => {
		const dispatch = jest.fn();
		const select = {
			getEntitiesConfig: jest.fn( () => entities ),
			getEntityConfig: jest.fn( () => ( {
				kind: 'postType',
				name: 'post',
			} ) ),
		};
		const entities = [ { kind: 'postType' } ];
		await getOrLoadEntitiesConfig(
			'postType',
			'post'
		)( { dispatch, select } );
		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'shouldn’t do anything if there no defined kind config', async () => {
		const dispatch = jest.fn();
		const select = {
			getEntitiesConfig: jest.fn( () => [] ),
			getEntityConfig: jest.fn( () => undefined ),
		};
		await getOrLoadEntitiesConfig(
			'unknownKind',
			undefined
		)( { dispatch, select } );
		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'should fetch and add the entities', async () => {
		const fetchedEntities = [
			{
				rest_base: 'posts',
				labels: {
					singular_name: 'post',
				},
				supports: {
					revisions: true,
				},
			},
		];
		const dispatch = jest.fn();
		const select = {
			getEntitiesConfig: jest.fn( () => [] ),
			getEntityConfig: jest.fn( () => undefined ),
		};
		triggerFetch.mockImplementation( () => fetchedEntities );

		await getOrLoadEntitiesConfig(
			'postType',
			'post'
		)( { dispatch, select } );
		expect( dispatch ).toHaveBeenCalledTimes( 1 );
		expect( dispatch.mock.calls[ 0 ][ 0 ].type ).toBe( 'ADD_ENTITIES' );
		expect( dispatch.mock.calls[ 0 ][ 0 ].entities.length ).toBe( 1 );
		expect( dispatch.mock.calls[ 0 ][ 0 ].entities[ 0 ].baseURL ).toBe(
			'/wp/v2/posts'
		);
		expect(
			dispatch.mock.calls[ 0 ][ 0 ].entities[ 0 ].getRevisionsUrl( 1 )
		).toBe( '/wp/v2/posts/1/revisions' );
		expect(
			dispatch.mock.calls[ 0 ][ 0 ].entities[ 0 ].getRevisionsUrl( 1, 2 )
		).toBe( '/wp/v2/posts/1/revisions/2' );
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
