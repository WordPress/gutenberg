/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { mediaUpload, getMimeTypesArray } from '../media-upload';

// Image uploading fails in a test environment because
// window.URL.createObjectURL is missing. We can check success by seeing if
// mediaUpload() attempts to create a blob URL for the image.
jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn(),
} ) );

const invalidMediaObj = {
	url: 'https://cldup.com/uuUqE_dXzy.jpg',
	type: 'text/xml',
	name: 'test.xml',
};

const validMediaObj = {
	url: 'https://cldup.com/uuUqE_dXzy.jpg',
	type: 'image/jpeg',
	size: 1024,
	name: 'test.jpeg',
};

describe( 'mediaUpload', () => {
	const onFileChangeSpy = jest.fn();

	beforeEach( () => {
		onFileChangeSpy.mockReset();
		createBlobURL.mockReset();
	} );

	it( 'should do nothing on no files', () => {
		mediaUpload( { filesList: [], onFileChange: onFileChangeSpy, allowedType: 'image' } );
		expect( onFileChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing on invalid image type', () => {
		const onError = jest.fn();
		mediaUpload( {
			filesList: [ invalidMediaObj ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'image' ],
			onError,
		} );
		expect( onFileChangeSpy ).not.toHaveBeenCalled();
		expect( onError ).toHaveBeenCalled();
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe( 'MIME_TYPE_NOT_SUPPORTED' );
	} );

	it( 'should error if allowedTypes contains a complete mime type string and the validation fails', () => {
		const onError = jest.fn();
		const testFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'image/jpeg',
			name: 'myImage.jpeg',
		};
		mediaUpload( {
			filesList: [ testFile ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'image/gif' ],
			onError,
		} );
		expect( createBlobURL ).not.toHaveBeenCalled();
		expect( onError ).toHaveBeenCalled();
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe( 'MIME_TYPE_NOT_SUPPORTED' );
	} );

	it( 'should work as expected if allowedTypes contains a complete mime type string and the validation has success', () => {
		const onError = jest.fn();
		const testFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'image/jpeg',
			name: 'myImage.jpeg',
		};

		mediaUpload( {
			filesList: [ testFile ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'image/jpeg' ],
			onError,
		} );
		expect( createBlobURL ).toHaveBeenCalled();
		expect( onError ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains multiple types and the validation fails', () => {
		const onError = jest.fn();
		const testFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'audio/mp3',
			name: 'mymusic.mp3',
		};
		mediaUpload( {
			filesList: [ testFile ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'video', 'image' ],
			onError,
		} );
		expect( createBlobURL ).not.toHaveBeenCalled();
		expect( onError ).toHaveBeenCalled();
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe( 'MIME_TYPE_NOT_SUPPORTED' );
	} );

	it( 'should work as expected if allowedTypes contains multiple types and the validation has success', () => {
		const onError = jest.fn();
		const testFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'audio/mp3',
			name: 'mymusic.mp3',
		};

		mediaUpload( {
			filesList: [ testFile ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'image', 'audio' ],
			onError,
		} );
		expect( createBlobURL ).toHaveBeenCalled();
		expect( onError ).not.toHaveBeenCalled();
	} );

	it( 'should only fail the file that caused the validation to fail and still allow others to succeed when uploading multiple files', () => {
		const onError = jest.fn();
		const invalidTestFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'image/jpeg',
			name: 'myimage.jpg',
		};
		const validTestFile = {
			url: 'https://cldup.com/uuUqE_dXzy.mp3',
			type: 'audio/mp3',
			name: 'mymusic.mp3',
		};

		mediaUpload( {
			filesList: [ invalidTestFile, validTestFile ],
			onFileChange: onFileChangeSpy,
			allowedTypes: [ 'audio' ],
			onError,
		} );

		expect( onError.mock.calls ).toHaveLength( 1 );
		expect( onError.mock.calls[ 0 ][ 0 ].file ).toBe( invalidTestFile );

		expect( createBlobURL.mock.calls ).toHaveLength( 1 );
		expect( createBlobURL ).toHaveBeenCalledWith( validTestFile );
	} );

	it( 'should call error handler with the correct error object if file size is greater than the maximum', () => {
		const onError = jest.fn();

		mediaUpload( {
			allowedTypes: [ 'image' ],
			filesList: [ validMediaObj ],
			onFileChange: onFileChangeSpy,
			maxUploadFileSize: 512,
			onError,
		} );
		expect( onError ).toHaveBeenCalled();
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe( 'SIZE_ABOVE_LIMIT' );
	} );

	it( 'should call error handler with the correct error object if file type is not allowed for user', () => {
		const onError = jest.fn();
		const wpAllowedMimeTypes = { aac: 'audio/aac' };

		mediaUpload( {
			allowedTypes: [ 'image' ],
			filesList: [ validMediaObj ],
			onFileChange: onFileChangeSpy,
			onError,
			wpAllowedMimeTypes,
		} );
		expect( onError ).toHaveBeenCalled();
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe( 'MIME_TYPE_NOT_ALLOWED_FOR_USER' );
	} );
} );

describe( 'getMimeTypesArray', () => {
	it( 'should return the parameter passed if it is "falsy" e.g: undefined or null', () => {
		expect( getMimeTypesArray( null ) ).toEqual( null );
		expect( getMimeTypesArray( undefined ) ).toEqual( undefined );
	} );

	it( 'should return an empty array if an empty object is passed', () => {
		expect( getMimeTypesArray( {} ) ).toEqual( [] );
	} );

	it( 'should return the type plus a new mime type with type and subtype with the extension if a type is passed', () => {
		expect(
			getMimeTypesArray( { ext: 'chicken' } )
		).toEqual(
			[ 'chicken', 'chicken/ext' ]
		);
	} );

	it( 'should return the mime type passed and a new mime type with type and the extension as subtype', () => {
		expect(
			getMimeTypesArray( { ext: 'chicken/ribs' } )
		).toEqual(
			[ 'chicken/ribs', 'chicken/ext' ]
		);
	} );

	it( 'should return the mime type passed and an additional mime type per extension supported', () => {
		expect(
			getMimeTypesArray( { 'jpg|jpeg|jpe': 'image/jpeg' } )
		).toEqual(
			[ 'image/jpeg', 'image/jpg', 'image/jpeg', 'image/jpe' ]
		);
	} );

	it( 'should handle multiple mime types', () => {
		expect(
			getMimeTypesArray( { 'ext|aaa': 'chicken/ribs', aaa: 'bbb' } )
		).toEqual( [
			'chicken/ribs',
			'chicken/ext',
			'chicken/aaa',
			'bbb',
			'bbb/aaa',
		] );
	} );
} );
