import { validateMimeTypeForUser } from '../validate-mime-type-for-user';
import { UploadError } from '../upload-error';

const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'validateMimeTypeForUser', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should not error if  wpAllowedMimeTypes is null or missing', async () => {
		expect( () => {
			validateMimeTypeForUser( imageFile );
		} ).not.toThrow();
		expect( () => {
			validateMimeTypeForUser( imageFile, null );
		} ).not.toThrow();
	} );

	// Browsers derive `file.type` from the file extension, so this check
	// compares WordPress's extension-to-mime table against the browser's.
	// Where the two disagree the file is still one WordPress accepts.
	it.each( [
		[ 'audio/x-m4a', 'song.m4a', { 'mp3|m4a|m4b': 'audio/mpeg' } ],
		[ 'audio/mp4', 'song.m4a', { 'mp3|m4a|m4b': 'audio/mpeg' } ],
		[ 'image/vnd.microsoft.icon', 'icon.ico', { ico: 'image/x-icon' } ],
		[ 'video/x-ms-wma', 'track.wma', { wma: 'audio/x-ms-wma' } ],
	] )( 'should not error for %s reported for %s', ( type, name, allowed ) => {
		const file = new window.File( [ 'fake_file' ], name, { type } );

		expect( () => {
			validateMimeTypeForUser( file, allowed );
		} ).not.toThrow();
	} );

	it( 'should match the extension case-insensitively', () => {
		const file = new window.File( [ 'fake_file' ], 'SONG.M4A', {
			type: 'audio/x-m4a',
		} );

		expect( () => {
			validateMimeTypeForUser( file, { 'mp3|m4a|m4b': 'audio/mpeg' } );
		} ).not.toThrow();
	} );

	it( 'should still error when the extension is not allowed for user', () => {
		const file = new window.File( [ 'fake_file' ], 'archive.zip', {
			type: 'application/zip',
		} );

		expect( () => {
			validateMimeTypeForUser( file, { 'mp3|m4a|m4b': 'audio/mpeg' } );
		} ).toThrow( UploadError );
	} );

	// `mediaUpload` is also called with raw Blobs, which have no name.
	it( 'should not throw when the file has no name', () => {
		const blob = new window.Blob( [ 'fake_file' ], {
			type: 'image/jpeg',
		} ) as File;

		expect( () => {
			validateMimeTypeForUser( blob, { 'jpg|jpeg|jpe': 'image/jpeg' } );
		} ).not.toThrow();
	} );

	it( 'should error if file type is not allowed for user', async () => {
		expect( () => {
			validateMimeTypeForUser( imageFile, { aac: 'audio/aac' } );
		} ).toThrow(
			new UploadError( {
				code: 'MIME_TYPE_NOT_ALLOWED_FOR_USER',
				message:
					'test.jpeg: Sorry, you are not allowed to upload this file type.',
				file: imageFile,
			} )
		);
	} );
} );
