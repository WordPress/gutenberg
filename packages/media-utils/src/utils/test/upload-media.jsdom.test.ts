import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';
import { uploadMedia } from '../upload-media';
import { UploadError } from '../upload-error';
import { uploadToServer } from '../upload-to-server';
import {
	getFailureCount,
	getState,
	reset,
} from '../../components/upload-progress-snackbar/tracker';

vi.mock( import( '../upload-to-server' ), () => ( {
	uploadToServer: vi.fn(),
} ) );

vi.mock(
	import( '@wordpress/blob' ),
	() =>
		( {
			createBlobURL: vi.fn(),
			revokeBlobURL: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/blob' )
);

const xmlFile = new window.File( [ 'fake_file' ], 'test.xml', {
	type: 'text/xml',
} );
const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'uploadMedia', () => {
	beforeEach( () => {
		reset();
	} );

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should do nothing on no files', () => {
		const onError = vi.fn();
		const onFileChange = vi.fn();
		uploadMedia( {
			filesList: [],
			onError,
			onFileChange,
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should error if allowedTypes contains a partial mime type and the validation fails', () => {
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
				file: imageFile,
			} )
		);
		expect( uploadToServer ).not.toHaveBeenCalled();
	} );

	it( 'should work if allowedTypes contains a complete mime type and the validation succeeds', () => {
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
		const onError = vi.fn();
		const onFileChange = vi.fn();
		uploadMedia( {
			allowedTypes: [ 'image' ],
			filesList: [ imageFile, xmlFile ],
			onError,
			onFileChange,
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
				message:
					'test.xml: Sorry, you are not allowed to upload this file type.',
				file: xmlFile,
			} )
		);
		expect( uploadToServer ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should error if the file size is greater than the maximum', () => {
		const onError = vi.fn();
		const onFileChange = vi.fn();
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
		const onError = vi.fn();
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
		const onError = vi.fn();
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
		( uploadToServer as Mock ).mockImplementation( () => {
			throw {
				code: 'fetch_error',
				message: 'Could not get a valid response from the server.',
			};
		} );

		const onError = vi.fn();
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

	it( 'should report a server failure when the response cannot be parsed', async () => {
		// What `apiFetch` rejects with when the endpoint answers with
		// something other than JSON, such as a PHP fatal error page.
		( uploadToServer as Mock ).mockRejectedValue( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );

		const onError = vi.fn();
		uploadMedia( {
			filesList: [ imageFile ],
			onError,
			multiple: false,
		} );

		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		expect( onError ).toHaveBeenCalledWith(
			new UploadError( {
				code: 'GENERAL',
				message: 'Failed to upload "test.jpeg". Please try again.',
				file: imageFile,
			} )
		);
	} );

	it( 'tracks in-flight files and clears the tracker when uploads complete', async () => {
		let resolveUpload: ( value: unknown ) => void;
		( uploadToServer as Mock ).mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolveUpload = resolve;
				} )
		);

		uploadMedia( {
			filesList: [ imageFile ],
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
		} );

		expect( getState() ).toEqual( {
			total: 1,
			completed: 0,
			pending: [ 'test.jpeg' ],
		} );

		resolveUpload!( { id: 1, url: 'https://example.com/test.jpeg' } );
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

		expect( getState() ).toBeNull();
		expect( getFailureCount() ).toBe( 0 );
	} );

	it( 'keeps a refused multi-file batch out of the upload progress tracker', () => {
		uploadMedia( {
			filesList: [ imageFile, xmlFile ],
			multiple: false,
		} );

		expect( getState() ).toBeNull();
	} );

	it( 'skips upload progress tracking when isTransportOnly is true', () => {
		( uploadToServer as Mock ).mockImplementation(
			() => new Promise( () => {} )
		);

		uploadMedia( {
			filesList: [ imageFile ],
			wpAllowedMimeTypes: { jpeg: 'image/jpeg' },
			isTransportOnly: true,
		} );

		expect( getState() ).toBeNull();
	} );

	it( 'removes the failed file from pending when a later file in the batch fails validation while an earlier file is uploading', () => {
		( uploadToServer as Mock ).mockImplementation(
			() => new Promise( () => {} )
		);

		uploadMedia( {
			filesList: [ imageFile, xmlFile ],
			allowedTypes: [ 'image' ],
			wpAllowedMimeTypes: {
				jpeg: 'image/jpeg',
				xml: 'application/xml',
			},
		} );

		expect( getState() ).toEqual( {
			total: 2,
			completed: 1,
			pending: [ 'test.jpeg' ],
		} );
		expect( getFailureCount() ).toBe( 1 );
	} );
} );
