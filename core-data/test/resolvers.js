/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import {
	getCategories,
	getMedia,
	getPostType,
	getUserPostTypeCapabilities,
} from '../resolvers';
import {
	setRequested,
	receiveTerms,
	receiveMedia,
	receivePostTypes,
	receiveUserPostTypeCapabilities,
} from '../actions';

jest.mock( '@wordpress/api-request' );

describe( 'getCategories', () => {
	const CATEGORIES = [ { id: 1 } ];

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/categories' ) {
				return Promise.resolve( CATEGORIES );
			}
		} );
	} );

	it( 'yields with requested terms', async () => {
		const fulfillment = getCategories();
		const requested = ( await fulfillment.next() ).value;
		expect( requested.type ).toBe( setRequested().type );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
	} );
} );

describe( 'getMedia', () => {
	const MEDIA = { id: 1 };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/media/1' ) {
				return Promise.resolve( MEDIA );
			}
		} );
	} );

	it( 'yields with requested media', async () => {
		const fulfillment = getMedia( {}, 1 );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveMedia( MEDIA ) );
	} );
} );

describe( 'getPostType', () => {
	const POST_TYPE = { slug: 'post' };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types/post?context=edit' ) {
				return Promise.resolve( POST_TYPE );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const fulfillment = getPostType( {}, 'post' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receivePostTypes( POST_TYPE ) );
	} );
} );

describe( 'getUserPostTypeCapabilities', () => {
	const USER = { post_type_capabilities: { publishPost: true } };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/users/me?post_type=post&context=edit' ) {
				return Promise.resolve( USER );
			}
		} );
	} );

	it( 'yields with received capabilties', async () => {
		const fulfillment = getUserPostTypeCapabilities( {}, 'post' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveUserPostTypeCapabilities( 'post', { publishPost: true } ) );
	} );
} );

