import { describe, expect, it } from 'vitest';
import { getUploadErrorMessage } from '../get-upload-error-message';

const SERVER_ERROR = 'Failed to upload "kitten.jpeg". Please try again.';

describe( 'getUploadErrorMessage', () => {
	it( 'keeps the message of a REST error', () => {
		expect(
			getUploadErrorMessage(
				{
					code: 'rest_upload_unknown_error',
					message: 'Sorry, you are not allowed to upload this file.',
				},
				'kitten.jpeg'
			)
		).toBe( 'Sorry, you are not allowed to upload this file.' );
	} );

	it( 'keeps the message of an Error instance', () => {
		expect(
			getUploadErrorMessage( new Error( 'Boom.' ), 'kitten.jpeg' )
		).toBe( 'Boom.' );
	} );

	it( 'keeps the offline message apiFetch produces for a failed request', () => {
		expect(
			getUploadErrorMessage(
				{
					code: 'fetch_error',
					message: 'You are probably offline.',
				},
				'kitten.jpeg'
			)
		).toBe( 'You are probably offline.' );
	} );

	it.each( [ 'invalid_json', 'unknown_error' ] )(
		'reports a server failure for the opaque apiFetch code %s',
		( code ) => {
			expect(
				getUploadErrorMessage(
					{
						code,
						message: 'The response is not a valid JSON response.',
					},
					'kitten.jpeg'
				)
			).toBe( SERVER_ERROR );
		}
	);

	it( 'reports a server failure for a rejection with no message, such as a Response', () => {
		expect(
			getUploadErrorMessage( { status: 500, ok: false }, 'kitten.jpeg' )
		).toBe( SERVER_ERROR );
	} );

	it.each( [ undefined, null, '', 0 ] )(
		'reports a server failure for the empty rejection %p',
		( error ) => {
			expect( getUploadErrorMessage( error, 'kitten.jpeg' ) ).toBe(
				SERVER_ERROR
			);
		}
	);

	it( 'keeps a rejection that is a plain string', () => {
		expect(
			getUploadErrorMessage( 'Upload cancelled', 'kitten.jpeg' )
		).toBe( 'Upload cancelled' );
	} );
} );
