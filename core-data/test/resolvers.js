/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getMedia, getPostType } from '../resolvers';
import { setRequested, receiveTerms, receiveMedia, receivePostTypes, setRequesting } from '../actions';

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
		const requesting = ( await fulfillment.next() ).value;
		expect( requesting.type ).toBe( setRequesting().type );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
		const requested = ( await fulfillment.next() ).value;
		expect( requested.type ).toBe( setRequested().type );
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
