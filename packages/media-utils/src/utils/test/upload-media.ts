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

	describe( 'onBatchSuccess', () => {
		it( 'should fire after all uploads complete', async () => {
			( uploadToServer as jest.Mock ).mockResolvedValue( { id: 1 } );

			const onBatchSuccess = jest.fn();
			uploadMedia( {
				filesList: [ imageFile ],
				onFileChange: jest.fn(),
				onBatchSuccess,
				wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
			} );

			// Wait for promises to settle.
			await Promise.resolve();

			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should fire when some uploads fail', async () => {
			( uploadToServer as jest.Mock ).mockRejectedValue(
				new Error( 'Upload failed' )
			);

			const onBatchSuccess = jest.fn();
			uploadMedia( {
				filesList: [ imageFile ],
				onFileChange: jest.fn(),
				onError: jest.fn(),
				onBatchSuccess,
				wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
			} );

			// Wait for promises to settle.
			await Promise.resolve();

			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should fire when all files fail validation (0 valid files)', async () => {
			const onBatchSuccess = jest.fn();
			uploadMedia( {
				allowedTypes: [ 'image' ],
				filesList: [ xmlFile ],
				onError: jest.fn(),
				onBatchSuccess,
			} );

			// Wait for promises to settle.
			await Promise.resolve();

			expect( uploadToServer ).not.toHaveBeenCalled();
			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should fire on multiple:false early return with too many files', () => {
			const onBatchSuccess = jest.fn();
			uploadMedia( {
				filesList: [ imageFile, xmlFile ],
				onError: jest.fn(),
				onBatchSuccess,
				multiple: false,
			} );

			expect( onBatchSuccess ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should not error when onBatchSuccess is omitted', async () => {
			( uploadToServer as jest.Mock ).mockResolvedValue( { id: 1 } );

			// Should not throw.
			uploadMedia( {
				filesList: [ imageFile ],
				onFileChange: jest.fn(),
				wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
			} );

			await Promise.resolve();
		} );
	} );
} );
