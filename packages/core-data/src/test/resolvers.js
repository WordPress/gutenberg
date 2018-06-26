/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getEntityRecord, getEntityRecords } from '../resolvers';
import { receiveTerms, receiveEntityRecords, addEntities } from '../actions';

jest.mock( '@wordpress/api-request' );

describe( 'getCategories', () => {
	const CATEGORIES = [ { id: 1 } ];

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/categories?per_page=-1' ) {
				return Promise.resolve( CATEGORIES );
			}
		} );
	} );

	it( 'yields with requested terms', async () => {
		const fulfillment = getCategories();
		const categories = await fulfillment.next().value;
		const received = fulfillment.next( categories ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
	} );
} );

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };
	const POST_TYPES = {
		post: {
			rest_base: 'posts',
		},
	};
	const POST = { id: 10, title: 'test' };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types/post?context=edit' ) {
				return Promise.resolve( POST_TYPE );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const fulfillment = getEntityRecord( {}, 'root', 'postType', 'post' );
		fulfillment.next(); // Trigger the getKindEntities generator
		const records = await fulfillment.next( [ { name: 'postType', kind: 'root', baseUrl: '/wp/v2/types' } ] ).value;
		const received = await fulfillment.next( records ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', POST_TYPE ) );
	} );
} );

describe( 'getEntityRecords', () => {
	const POST_TYPES = {
		post: { slug: 'post' },
		page: { slug: 'page' },
	};

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types?context=edit' ) {
				return Promise.resolve( POST_TYPES );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const fulfillment = getEntityRecords( {}, 'root', 'postType' );
		fulfillment.next(); // Trigger the getKindEntities generator
		const records = await fulfillment.next( [ { name: 'postType', kind: 'root', baseUrl: '/wp/v2/types' } ] ).value;
		const received = ( await fulfillment.next( records ) ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', Object.values( POST_TYPES ) ) );
	} );
} );
