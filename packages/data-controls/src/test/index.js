/**
 * External dependencies
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';

vi.mock( import( '@wordpress/api-fetch' ) );

const mockedTriggerFetch = vi.mocked( triggerFetch );

/**
 * Internal dependencies
 */
import { controls } from '../index';

describe( 'controls', () => {
	describe( 'API_FETCH', () => {
		afterEach( () => {
			mockedTriggerFetch.mockClear();
		} );
		it( 'invokes the triggerFetch function', () => {
			controls.API_FETCH( { request: '' } );
			expect( mockedTriggerFetch ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'invokes the triggerFetch function with the passed in request', () => {
			controls.API_FETCH( { request: 'foo' } );
			expect( mockedTriggerFetch ).toHaveBeenCalledWith( 'foo' );
		} );
	} );
} );
