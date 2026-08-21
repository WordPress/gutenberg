import apiFetch from '@wordpress/api-fetch';
import mediaFinalize from '..';
import { receiveFinalizedAttachment } from '../../media-upload/finalized-attachments';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '../../media-upload/finalized-attachments', () => ( {
	receiveFinalizedAttachment: jest.fn(),
} ) );

const mockRestAttachment = {
	id: 123,
	alt_text: '',
	caption: { raw: '' },
	title: { raw: '' },
	source_url: 'https://example.com/wp-content/uploads/image-scaled.jpg',
};

describe( 'mediaFinalize', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should call the finalize endpoint with the correct path, method, and sub_sizes', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );

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
		apiFetch.mockResolvedValue( mockRestAttachment );

		await mediaFinalize( 123 );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/finalize',
			method: 'POST',
			data: { sub_sizes: [] },
		} );
	} );

	it( 'should return the transformed attachment with the scaled URL so the block can pick up srcset', async () => {
		apiFetch.mockResolvedValue( mockRestAttachment );

		const result = await mediaFinalize( 123 );

		// transformAttachment maps source_url -> url, which is the key the
		// block stores. Without this mapping, the block keeps the original
		// (pre-finalize) URL and wp_calculate_image_srcset() emits no srcset.
		expect( result ).toMatchObject( {
			id: 123,
			url: 'https://example.com/wp-content/uploads/image-scaled.jpg',
		} );
	} );

	it( 'should return undefined when the response is empty', async () => {
		apiFetch.mockResolvedValue( undefined );

		const result = await mediaFinalize( 123 );

		expect( result ).toBeUndefined();
	} );

	it( 'should propagate errors from apiFetch', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		await expect( mediaFinalize( 456 ) ).rejects.toThrow( 'Network error' );
	} );

	it( 'should store the finalize response as the attachment record', async () => {
		// The finalize response is the attachment as prepared after its
		// sub-size metadata was written, so it is what the editor should hold.
		// Receiving it here is what removes the need to fetch the attachment
		// again just to pick the generated sizes up.
		const finalized = {
			...mockRestAttachment,
			media_details: { sizes: { thumbnail: {} } },
		};
		apiFetch.mockResolvedValue( finalized );

		await mediaFinalize( 123 );

		// The untransformed record: core-data holds REST records, and
		// transformAttachment renames fields for block consumers.
		expect( receiveFinalizedAttachment ).toHaveBeenCalledWith( finalized );
	} );

	it( 'should store nothing when the response is empty', async () => {
		apiFetch.mockResolvedValue( undefined );

		await mediaFinalize( 123 );

		expect( receiveFinalizedAttachment ).not.toHaveBeenCalled();
	} );
} );
