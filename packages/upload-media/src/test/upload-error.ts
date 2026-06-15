/**
 * Internal dependencies
 */
import { UploadError } from '../upload-error';

describe( 'UploadError', () => {
	it( 'holds error code and file name', () => {
		const file = new File( [], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );

		const error = new UploadError( {
			code: 'some_error',
			message: 'An error occurred',
			file,
		} );

		expect( error ).toStrictEqual( expect.any( Error ) );
		expect( error.code ).toBe( 'some_error' );
		expect( error.message ).toBe( 'An error occurred' );
		expect( error.file ).toBe( file );
	} );
} );
