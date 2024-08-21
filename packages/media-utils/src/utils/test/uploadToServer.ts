/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { uploadToServer } from '../uploadToServer';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn( () =>
		Promise.resolve( {
			id: 900,
			title: {
				raw: 'Photo',
			},
			meta: {},
		} )
	),
} ) );

describe( 'uploadToServer', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	/*
	 TODO: Fix Blob polyfill in jsdom.
	 Test is skipped because of the following error:
	 "TypeError: Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'."
	 In setuo-globals.js we're using Node's Blob implementation
	 because of https://github.com/jsdom/jsdom/issues/2555,
	 but jsdom expects its own implementation.
	*/
	it.skip( 'sends form data', async () => {
		const jpegFile = new File( [], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );

		await uploadToServer( jpegFile, {
			featured_media: 123,
			filename: 'example.jpg',
			meta: {
				foo: 'bar',
			},
		} );

		// TODO: Actually test sent form data is flattened.
		expect( apiFetch ).toHaveBeenCalled();
	} );
} );
