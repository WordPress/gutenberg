/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getEntityRecord } from '../resolvers';
import { toggleIsRequestingTerms, receiveTerms, receiveEntityRecords } from '../actions';

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
		const fulfillment = getCategories.fulfill();
		const requested = ( await fulfillment.next() ).value;
		expect( requested.type ).toBe( toggleIsRequestingTerms().type );
		expect( requested.isRequesting ).toBe( true );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', undefined, CATEGORIES ) );
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
