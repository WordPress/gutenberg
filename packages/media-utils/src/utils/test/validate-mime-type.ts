/**
 * Internal dependencies
 */
import { validateMimeType } from '../validate-mime-type';
import { UploadError } from '../upload-error';

const xmlFile = new window.File( [ 'fake_file' ], 'test.xml', {
	type: 'text/xml',
} );
const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'validateMimeType', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should error if allowedTypes contains a partial mime type and the validation fails', async () => {
		expect( () => {
			validateMimeType( xmlFile, [ 'image' ] );
		} ).toThrow(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.xml: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
	} );

	it( 'should error if allowedTypes contains a complete mime type and the validation fails', async () => {
		expect( () => {
			validateMimeType( imageFile, [ 'image/gif' ] );
		} ).toThrow(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.jpeg: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
	} );

	it( 'should error if allowedTypes contains multiple types and the validation fails', async () => {
		expect( () => {
			validateMimeType( xmlFile, [ 'video', 'image' ] );
		} ).toThrow(
			new UploadError( {
				code: 'MIME_TYPE_NOT_SUPPORTED',
				message:
					'test.xml: Sorry, this file type is not supported here.',
				file: xmlFile,
			} )
		);
	} );
} );
