/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getEntityRecord, getEntityRecords, getPost } from '../resolvers';
import { receiveTerms, receiveEntityRecords, receivePosts } from '../actions';

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
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
	} );
} );

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types/post?context=edit' ) {
				return Promise.resolve( POST_TYPE );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const fulfillment = getEntityRecord( {}, 'root', 'postType', 'post' );
		const received = ( await fulfillment.next() ).value;
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
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', Object.values( POST_TYPES ) ) );
	} );
} );

describe( 'getPost', () => {
	const POST = { id: 10 };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/posts/10?context=edit' ) {
				return Promise.resolve( POST );
			}
		} );
	} );

	it( 'yields with requested post', async () => {
		const fulfillment = getPost( {}, 10 );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receivePosts( POST ) );
	} );
} );
