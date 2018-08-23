/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getMethodName, defaultEntities, getKindEntities } from '../entities';
import { addEntities } from '../actions';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'getMethodName', () => {
	it( 'should return the right method name for an entity with the root kind', () => {
		const methodName = getMethodName( 'root', 'postType' );

		expect( methodName ).toEqual( 'getPostType' );
	} );

	it( 'should use a different suffix', () => {
		const methodName = getMethodName( 'root', 'postType', 'set' );

		expect( methodName ).toEqual( 'setPostType' );
	} );

	it( 'should use the plural form', () => {
		const methodName = getMethodName( 'root', 'postType', 'get', true );

		expect( methodName ).toEqual( 'getPostTypes' );
	} );

	it( 'should use the given plural form', () => {
		const methodName = getMethodName( 'root', 'taxonomy', 'get', true );

		expect( methodName ).toEqual( 'getTaxonomies' );
	} );

	it( 'should include the kind in the method name', () => {
		const id = defaultEntities.length;
		defaultEntities[ id ] = { name: 'book', kind: 'postType' };
		const methodName = getMethodName( 'postType', 'book' );
		delete defaultEntities[ id ];

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );

describe( 'getKindEntities', () => {
	const POST_TYPES = {
		post: {
			rest_base: 'posts',
		},
	};

	beforeAll( () => {
		apiFetch.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types?context=edit' ) {
				return Promise.resolve( POST_TYPES );
			}
		} );
	} );

	it( 'shouldn’t do anything if the entities have already been resolved', async () => {
		const state = {
			entities: { config: [ { kind: 'postType' } ] },
		};
		const fulfillment = getKindEntities( state, 'postType' );
		const done = ( await fulfillment.next() ).done;
		expect( done ).toBe( true );
	} );

	it( 'shouldn’t do anything if there no defined kind config', async () => {
		const state = { entities: { config: [] } };
		const fulfillment = getKindEntities( state, 'unknownKind' );
		const done = ( await fulfillment.next() ).done;
		expect( done ).toBe( true );
	} );

	it( 'should fetch and add the entities', async () => {
		const state = { entities: { config: [] } };
		const fulfillment = getKindEntities( state, 'postType' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( addEntities( [ {
			baseURL: '/wp/v2/posts',
			kind: 'postType',
			name: 'post',
		} ] ) );
	} );
} );
