/**
 * WordPress dependencies
 */
import type { APIFetchOptions } from '@wordpress/api-fetch';
import triggerFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import { controls } from '../index';

describe( 'controls', () => {
	describe( 'API_FETCH', () => {
		afterEach( () => {
			( triggerFetch as unknown as jest.Mock ).mockClear();
		} );
		it( 'invokes the triggerFetch function', () => {
			controls.API_FETCH( { request: '' as APIFetchOptions } );
			expect( triggerFetch ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'invokes the triggerFetch function with the passed in request', () => {
			controls.API_FETCH( { request: 'foo' as APIFetchOptions } );
			expect( triggerFetch ).toHaveBeenCalledWith( 'foo' );
		} );
	} );
} );
