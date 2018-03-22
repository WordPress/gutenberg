/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getMedia } from '../resolvers';
import { setRequested, receiveTerms, receiveMedia } from '../actions';

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
