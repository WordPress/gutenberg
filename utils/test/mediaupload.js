/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import { mediaUpload } from '../mediaupload';

// mediaUpload is passed the setAttributes function
// so we can stub that out have it pass the data to
// console.error to check if proper thing is called
const setAttributesStub = ( obj ) => console.error( obj );

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

	it( 'should do nothing on no files', () => {
		mediaUpload( [ ], setAttributesStub );
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing on invalid image type', () => {
		mediaUpload( [ invalidMediaObj ], setAttributesStub );
		expect( console.error ).not.toHaveBeenCalled();
	} );
} );
