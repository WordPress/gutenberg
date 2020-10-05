/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import { controls } from '../index';

describe( 'controls', () => {
	describe( 'API_FETCH', () => {
		afterEach( () => {
			triggerFetch.mockClear();
		} );
		it( 'invokes the triggerFetch function', () => {
			controls.API_FETCH( { request: '' } );
			expect( triggerFetch ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'invokes the triggerFetch function with the passed in request', () => {
			controls.API_FETCH( { request: 'foo' } );
			expect( triggerFetch ).toHaveBeenCalledWith( 'foo' );
		} );
	} );
} );
