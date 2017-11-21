/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import { mediaUpload } from '../mediaupload';

jest.mock( '../url', () => ( {
	createObjectUrl: () => 'blob:foo',
} ) );

jest.mock( '../media', () => ( {
	createMediaFromFile: () => Promise.resolve( 'http://foo.com' ),
} ) );

const invalidMediaObj = {
	url: 'https://cldup.com/uuUqE_dXzy.jpg',
	type: 'text/xml',
};

describe( 'mediaUpload', () => {
	const originalConsoleError = console.error;
	const originalGetUserSetting = window.getUserSetting;

	beforeEach( () => {
		console.error = jest.fn();
	} );

	afterEach( () => {
		console.error = originalConsoleError;
		window.getUserSetting = originalGetUserSetting;
	} );

	it( 'should do nothing on no files', done => {
		const tempImageCallback = jest.fn();
		const uploadedImageCallback = jest.fn();

		mediaUpload( [ ], tempImageCallback, uploadedImageCallback, () => {
			expect( tempImageCallback.mock.calls.length ).toBe( 1 );
			expect( tempImageCallback.mock.calls[ 0 ][ 0 ] ).toEqual( [] );
			expect( uploadedImageCallback.mock.calls.length ).toBe( 0 );
			done();
		} );
	} );

	it( 'should do nothing on invalid image type', done => {
		const tempImageCallback = jest.fn();
		const uploadedImageCallback = jest.fn();

		mediaUpload( [ invalidMediaObj ], tempImageCallback, uploadedImageCallback, () => {
			expect( tempImageCallback.mock.calls.length ).toBe( 1 );
			expect( tempImageCallback.mock.calls[ 0 ][ 0 ] ).toEqual( [] );
			expect( uploadedImageCallback.mock.calls.length ).toBe( 0 );
			done();
		} );
	} );

	it( 'should upload image', done => {
		const tempImageCallback = jest.fn();
		const uploadedImageCallback = jest.fn();

		mediaUpload( [ { type: 'image/png' } ], tempImageCallback, uploadedImageCallback, () => {
			expect( tempImageCallback.mock.calls.length ).toBe( 1 );
			expect( tempImageCallback.mock.calls[ 0 ][ 0 ] ).toEqual( [ 'blob:foo' ] );

			expect( uploadedImageCallback.mock.calls.length ).toBe( 1 );
			expect( uploadedImageCallback.mock.calls[ 0 ][ 0 ] ).toBe( null );
			expect( uploadedImageCallback.mock.calls[ 0 ][ 1 ] ).toEqual( { index: 0, image: 'http://foo.com' } );

			done();
		} );
	} );
} );
