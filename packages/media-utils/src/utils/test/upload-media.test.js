/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { uploadMedia, getMimeTypesArray } from '../upload-media';

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn(),
	revokeBlobURL: jest.fn(),
} ) );
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const xmlFile = new window.File( [ 'fake_file' ], 'test.xml', { type: 'text/xml' } );
const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', { type: 'image/jpeg' } );

describe( 'uploadMedia', () => {
	it( 'should do nothing on no files', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			filesList: [],
			onError,
			onFileChange,
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains a partial mime type and the validation fails', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ xmlFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
		} ) );
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains a complete mime type and the validation fails', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image/gif' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
		} ) );
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'should work if allowedTypes contains a complete mime type and the validation succeeds', async () => {
		createBlobURL.mockReturnValue( 'blob:fake_blob' );
		apiFetch.mockResolvedValue( { title: { raw: 'Test' } } );

		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image/jpeg' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( onFileChange ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should error if allowedTypes contains multiple types and the validation fails', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'video', 'image' ],
			filesList: [ xmlFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
		} ) );
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'should work if allowedTypes contains multiple types and the validation succeeds', async () => {
		createBlobURL.mockReturnValue( 'blob:fake_blob' );
		apiFetch.mockResolvedValue( { title: { raw: 'Test' } } );

		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'video', 'image' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( onFileChange ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should only fail the invalid file and still allow others to succeed when uploading multiple files', async () => {
		createBlobURL.mockReturnValue( 'blob:fake_blob' );
		apiFetch.mockResolvedValue( { title: { raw: 'Test' } } );

		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile, xmlFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'MIME_TYPE_NOT_SUPPORTED',
			file: xmlFile,
		} ) );
		expect( onFileChange ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should error if the file size is greater than the maximum', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile ],
			maxUploadFileSize: 1,
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'SIZE_ABOVE_LIMIT',
		} ) );
		expect( onFileChange ).not.toHaveBeenCalled();
	} );

	it( 'should call error handler with the correct error object if file type is not allowed for user', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile ],
			onError,
			wpAllowedMimeTypes: { aac: 'audio/aac' },
		} );

		expect( onError ).toHaveBeenCalledWith( expect.objectContaining( {
			code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
		} ) );
		expect( onFileChange ).not.toHaveBeenCalled();
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
