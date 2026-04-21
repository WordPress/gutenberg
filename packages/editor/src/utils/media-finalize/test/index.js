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

	it( 'should call the finalize endpoint with the correct path, method, and sub_sizes', async () => {
		apiFetch.mockResolvedValue( {} );

		const subSizes = [
			{
				image_size: 'thumbnail',
				width: 150,
				height: 150,
				file: 'image-150x150.jpg',
				mime_type: 'image/jpeg',
				filesize: 5000,
			},
		];

		await mediaFinalize( 123, subSizes );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/finalize',
			method: 'POST',
			data: { sub_sizes: subSizes },
		} );
	} );

	it( 'should send empty sub_sizes array by default', async () => {
		apiFetch.mockResolvedValue( {} );

		await mediaFinalize( 123 );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/finalize',
			method: 'POST',
			data: { sub_sizes: [] },
		} );
	} );

	it( 'should propagate errors from apiFetch', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		await expect( mediaFinalize( 456 ) ).rejects.toThrow( 'Network error' );
	} );
} );
