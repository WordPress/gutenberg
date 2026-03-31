/**
 * Internal dependencies
 */
import { uploadMedia } from '../upload-media';
import { UploadError } from '../upload-error';
import { uploadToServer } from '../upload-to-server';

jest.mock( '../upload-to-server', () => ( {
	uploadToServer: jest.fn(),
} ) );

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn(),
	revokeBlobURL: jest.fn(),
} ) );

const xmlFile = new window.File( [ 'fake_file' ], 'test.xml', {
	type: 'text/xml',
} );
const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'uploadMedia', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should do nothing on no files', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			filesList: [],
			onError,
			onFileChange,
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains a partial mime type and the validation fails', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ xmlFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.xml: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains a complete mime type and the validation fails', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image/gif' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.jpeg: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should work if allowedTypes contains a complete mime type and the validation succeeds', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image/jpeg' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( uploadToServer ).toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains multiple types and the validation fails', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'video', 'image' ],
			filesList: [ xmlFile ],
			onError,
			onFileChange,
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.xml: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should work if allowedTypes contains multiple types and the validation succeeds', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'video', 'image' ],
			filesList: [ imageFile ],
			onError,
			onFileChange,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg', mp4: 'video/mp4' },
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( uploadToServer ).toHaveBeenCalled();
	} );

	it( 'should only fail the invalid file and still allow others to succeed when uploading multiple files', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile, xmlFile ],
			onError,
			onFileChange,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.xml: Sorry, you are not allowed to upload this file type.',
				file: xmlFile,
			} )
		);
		expect( uploadToServer ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should error if the file size is greater than the maximum', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile ],
			maxUploadFileSize: 1,
			onError,
			onFileChange,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'SIZE_ABOVE_LIMIT',
				message:
					'test.jpeg: This file exceeds the maximum upload size for this site.',
				file: imageFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should call error handler with the correct error object if file type is not allowed for user', () => {
		const onError = jest.fn();
		uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile ],
			onError,
			wpAllowedMimeTypes: { aac: 'audio/aac' },
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
				message:
					'test.jpeg: Sorry, you are not allowed to upload this file type.',
				file: imageFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should throw error when multiple files are selected in single file upload mode', () => {
		const onError = jest.fn();
		uploadMedia( {
			filesList: [ imageFile, xmlFile ],
			onError,
			multiple: false,
		} );

		expect( onError ).toHaveBeenCalledWith(
			new Error( 'Only one file can be used here.' )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should pass onProgress wrapper that includes the file', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		const onProgress = jest.fn();
		uploadMedia( {
			filesList: [ imageFile ],
			onError,
			onFileChange,
			onProgress,
		} );

		// uploadToServer should receive a wrapper function, not the raw callback.
		const passedOnProgress = ( uploadToServer as jest.Mock ).mock
			.calls[ 0 ][ 3 ];
		expect( typeof passedOnProgress ).toBe( 'function' );

		// Calling the wrapper should invoke onProgress with progress and the file.
		passedOnProgress( 50 );
		expect( onProgress ).toHaveBeenCalledWith( 50, imageFile );
	} );

	it( 'should pass undefined when no onProgress is provided', () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		uploadMedia( {
			filesList: [ imageFile ],
			onError,
			onFileChange,
		} );

		expect( uploadToServer ).toHaveBeenCalledWith(
			imageFile,
			expect.anything(),
			undefined,
			undefined
		);
	} );

	it( 'should include the correct file in onProgress for multi-file uploads', () => {
		const onProgress = jest.fn();
		const secondImageFile = new window.File(
			[ 'fake_file_2' ],
			'test2.jpeg',
			{ type: 'image/jpeg' }
		);

		uploadMedia( {
			filesList: [ imageFile, secondImageFile ],
			onProgress,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( uploadToServer ).toHaveBeenCalledTimes( 2 );

		// Each file gets its own wrapper that tags progress with the correct file.
		const firstOnProgress = ( uploadToServer as jest.Mock ).mock
			.calls[ 0 ][ 3 ];
		const secondOnProgress = ( uploadToServer as jest.Mock ).mock
			.calls[ 1 ][ 3 ];

		firstOnProgress( 30 );
		expect( onProgress ).toHaveBeenCalledWith( 30, imageFile );

		secondOnProgress( 60 );
		expect( onProgress ).toHaveBeenCalledWith( 60, secondImageFile );
	} );

	it( 'should return error that is not an Error object', () => {
		( uploadToServer as jest.Mock ).mockImplementation( () => {
			throw {
				code: 'fetch_error',
				message: 'Could not get a valid response from the server.',
			};
		} );

		const onError = jest.fn();
		uploadMedia( {
			filesList: [ imageFile ],
			onError,
			multiple: false,
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'GENERAL',
				message: 'Could not get a valid response from the server.',
				file: imageFile,
			} )
		);
	} );
} );
