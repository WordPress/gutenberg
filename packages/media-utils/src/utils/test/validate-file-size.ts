/**
 * Internal dependencies
 */
import { validateFileSize } from '../validate-file-size';
import { UploadError } from '../upload-error';

const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

const emptyFile = new window.File( [], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'validateFileSize', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should error if the file is empty', () => {
		expect( () => {
			validateFileSize( emptyFile );
		} ).toThrow(
			new UploadError( {
				code: 'EMPTY_FILE',
				message: 'test.jpeg: This file is empty.',
				file: imageFile,
			} )
		);
	} );

	it( 'should error if the file is is greater than the maximum', () => {
		expect( () => {
			validateFileSize( imageFile, 2 );
		} ).toThrow(
			new UploadError( {
				code: 'SIZE_ABOVE_LIMIT',
				message:
					'test.jpeg: This file exceeds the maximum upload size for this site.',
				file: imageFile,
			} )
		);
	} );

	it( 'should not error if the file is below the limit', () => {
		expect( () => {
			validateFileSize( imageFile, 100 );
		} ).not.toThrow(
			new UploadError( {
				code: 'SIZE_ABOVE_LIMIT',
				message:
					'test.jpeg: This file exceeds the maximum upload size for this site.',
				file: imageFile,
			} )
		);
	} );

	it( 'should not error if there is no limit', () => {
		expect( () => {
			validateFileSize( imageFile );
		} ).not.toThrow(
			new UploadError( {
				code: 'SIZE_ABOVE_LIMIT',
				message:
					'test.jpeg: This file exceeds the maximum upload size for this site.',
				file: imageFile,
			} )
		);
	} );
} );
