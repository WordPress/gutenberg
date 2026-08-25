import { getErrorMessage } from '../error-messages';
import { ErrorCode } from '../upload-error';

describe( 'getErrorMessage', () => {
	it( 'should return a dedicated message for every known error code', () => {
		for ( const code of Object.values( ErrorCode ) ) {
			const message = getErrorMessage( code, 'photo.jpg' );

			expect( message.title ).toBeTruthy();
			expect( message.description ).toBeTruthy();
		}
	} );

	it( 'should interpolate the file name into the description', () => {
		const message = getErrorMessage(
			ErrorCode.SIZE_ABOVE_LIMIT,
			'photo.jpg'
		);

		expect( message.title ).toBe( 'File too large' );
		expect( message.description ).toContain( 'photo.jpg' );
		expect( message.action ).toBeTruthy();
	} );

	it( 'should return distinct messages for different codes', () => {
		const empty = getErrorMessage( ErrorCode.EMPTY_FILE, 'photo.jpg' );
		const heic = getErrorMessage(
			ErrorCode.HEIC_DECODE_ERROR,
			'photo.jpg'
		);

		expect( empty.title ).not.toBe( heic.title );
	} );

	it( 'should return JXL-specific copy rather than the generic fallback', () => {
		/*
		 * The JXL decode failure used to be raised with a bare
		 * 'JXL_DECODE_ERROR' string that was absent from both the ErrorCode
		 * enum and this table, so an unrecoverable decode failure was
		 * reported as "Upload failed / Please try again".
		 */
		const jxl = getErrorMessage( ErrorCode.JXL_DECODE_ERROR, 'photo.jxl' );
		const general = getErrorMessage( ErrorCode.GENERAL, 'photo.jxl' );

		expect( jxl.title ).not.toBe( general.title );
		expect( jxl.action ).not.toBe( general.action );
		expect( jxl.description ).toContain( 'photo.jxl' );
	} );

	it( 'should fall back to the generic message for an unknown code', () => {
		const fallback = getErrorMessage( 'SOME_UNKNOWN_CODE', 'photo.jpg' );
		const general = getErrorMessage( ErrorCode.GENERAL, 'photo.jpg' );

		expect( fallback ).toEqual( general );
		expect( fallback.description ).toContain( 'photo.jpg' );
	} );
} );
