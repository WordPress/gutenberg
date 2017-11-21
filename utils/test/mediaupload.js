/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import { mediaUpload } from '../mediaupload';

jest.mock( '../object', () => ( {
	createObjectUrl: () => { },
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
} );
