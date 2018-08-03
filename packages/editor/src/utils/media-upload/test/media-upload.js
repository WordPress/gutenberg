/**
 * Internal dependencies
 */
import { mediaUpload, getMimeTypesArray } from '../media-upload';

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
	const onFileChangeSpy = jest.fn();

	it( 'should do nothing on no files', () => {
		mediaUpload( { filesList: [], onFileChange: onFileChangeSpy, allowedType: 'image' } );
		expect( onFileChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing on invalid image type', () => {
		mediaUpload( { filesList: [ invalidMediaObj ], onFileChange: onFileChangeSpy, allowedType: 'image' } );
		expect( onFileChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should call error handler with the correct error object if file size is greater than the maximum', () => {
		const onError = jest.fn();

		mediaUpload( {
			allowedType: 'image',
			filesList: [ validMediaObj ],
			onFileChange: onFileChangeSpy,
			maxUploadFileSize: 512,
			onError,
		} );
		expect( onError ).toBeCalledWith( {
			code: 'SIZE_ABOVE_LIMIT',
			file: validMediaObj,
			message: `${ validMediaObj.name } exceeds the maximum upload size for this site.`,
		} );
	} );

	it( 'should call error handler with the correct error object if file type is not allowed for user', () => {
		const onError = jest.fn();
		const allowedMimeTypes = { aac: 'audio/aac' };

		mediaUpload( {
			allowedType: 'image',
			filesList: [ validMediaObj ],
			onFileChange: onFileChangeSpy,
			onError,
			allowedMimeTypes,
		} );
		expect( onError ).toBeCalledWith( {
			code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
			file: validMediaObj,
			message: 'Sorry, this file type is not permitted for security reasons.',
		} );
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
