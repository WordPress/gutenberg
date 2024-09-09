/**
 * Internal dependencies
 */
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
