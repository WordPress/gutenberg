/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import mediaFinalize from '..';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'mediaFinalize', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should call the finalize endpoint with the correct path and method', async () => {
		apiFetch.mockResolvedValue( {} );

		await mediaFinalize( 123 );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/finalize',
			method: 'POST',
		} );
	} );

	it( 'should propagate errors from apiFetch', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		await expect( mediaFinalize( 456 ) ).rejects.toThrow( 'Network error' );
	} );
} );
