/**
 * Internal dependencies
 */
import { buildHydratedInitialState } from '../preload-hydrate';

describe( 'buildHydratedInitialState', () => {
	const originalWindow = global.window;

	afterEach( () => {
		delete global.window.__wpCoreDataPreload;
	} );

	afterAll( () => {
		global.window = originalWindow;
	} );

	it( 'returns undefined with no preload', () => {
		expect( buildHydratedInitialState() ).toBeUndefined();
	} );

	it( 'returns undefined for an empty preload', () => {
		global.window.__wpCoreDataPreload = [];
		expect( buildHydratedInitialState() ).toBeUndefined();
	} );

	it( 'folds a getCurrentUser entry into root + marks resolution finished', () => {
		global.window.__wpCoreDataPreload = [
			{
				selector: 'getCurrentUser',
				args: [],
				data: { id: 1, name: 'admin' },
			},
		];
		const initial = buildHydratedInitialState();
		expect( initial ).toBeDefined();
		expect( initial.root.currentUser ).toEqual( {
			id: 1,
			name: 'admin',
		} );
		expect( initial.metadata.getCurrentUser.get( [] ) ).toEqual( {
			status: 'finished',
		} );
	} );

	it( 'folds a getEntityRecord entry for a post into queriedData (when entity config is registered)', () => {
		global.window.__wpCoreDataPreload = [
			// The reducer can only place the record once an addEntities for
			// postType/post has registered the entity slot. Mirror what the
			// getEntitiesConfig resolver does today.
			{
				selector: 'getEntitiesConfig',
				args: [ 'postType' ],
				data: {
					post: {
						name: 'Posts',
						slug: 'post',
						rest_base: 'posts',
						rest_namespace: 'wp/v2',
						taxonomies: [],
					},
				},
			},
			{
				selector: 'getEntityRecord',
				args: [ 'postType', 'post', 2001 ],
				data: { id: 2001, title: { raw: 'Hello' }, type: 'post' },
				allow: 'GET, POST, PUT, PATCH, DELETE',
			},
		];
		const initial = buildHydratedInitialState();
		const queriedData =
			initial.root.entities.records.postType.post.queriedData;
		expect( queriedData.items.default[ 2001 ] ).toMatchObject( {
			id: 2001,
			type: 'post',
		} );
		expect( queriedData.itemIsComplete.default[ 2001 ] ).toBe( true );
		expect(
			initial.metadata.getEntityRecord.get( [ 'postType', 'post', 2001 ] )
		).toEqual( { status: 'finished' } );

		// canUser permissions should be primed for each action, and the
		// resolver marked finished so the OPTIONS request doesn't fire.
		expect(
			initial.root.userPermissions[ 'update/postType/post/2001' ]
		).toBe( true );
		expect(
			initial.root.userPermissions[ 'delete/postType/post/2001' ]
		).toBe( true );
		expect(
			initial.metadata.canUser.get( [
				'update',
				{ kind: 'postType', name: 'post', id: 2001 },
			] )
		).toEqual( { status: 'finished' } );
	} );
} );
