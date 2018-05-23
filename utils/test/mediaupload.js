/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import { mediaUpload } from '../mediaupload';

// mediaUpload is passed the onImagesChange function
// so we can stub that out have it pass the data to
// console.error to check if proper thing is called
const onFileChange = ( obj ) => console.error( obj );

const invalidMediaObj = {
	url: 'https://cldup.com/uuUqE_dXzy.jpg',
	type: 'text/xml',
};

const validMediaObj = {
	url: 'https://cldup.com/uuUqE_dXzy.jpg',
	type: 'image/jpeg',
	size: 1024,
	name: 'test.jpeg',
};

describe( 'mediaUpload', () => {
	const originalConsoleError = console.error;
	const originalGetUserSetting = window.getUserSetting;

	beforeEach( () => {
		console.error = jest.fn();
	} );

	afterEach( () => {
		console.error = originalConsoleError;
		window.getUserSetting = originalGetUserSetting;
	} );

	it( 'should do nothing on no files', () => {
		mediaUpload( { filesList: [ ], onFileChange, allowedType: 'image' } );
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing on invalid image type', () => {
		mediaUpload( { filesList: [ invalidMediaObj ], onFileChange, allowedType: 'image' } );
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'should call error handler with the correct message if file size is greater than the maximum', () => {
		const onError = jest.fn();
		mediaUpload( {
			allowedType: 'image',
			filesList: [ validMediaObj ],
			onFileChange,
			maxUploadFileSize: 512,
			onError,
		} );
		expect( onError.mock.calls ).toEqual( [ [ { sizeAboveLimit: true, file: validMediaObj } ] ] );
	} );
} );
