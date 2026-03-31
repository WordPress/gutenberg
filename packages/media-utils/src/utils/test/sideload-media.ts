/**
 * Internal dependencies
 */
import { sideloadMedia } from '../sideload-media';
import { sideloadToServer } from '../sideload-to-server';

jest.mock( '../sideload-to-server', () => ( {
	sideloadToServer: jest.fn(),
} ) );

const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'sideloadMedia', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should sideload to server', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await sideloadMedia( {
			file: imageFile,
			attachmentId: 1,
			onError,
			onFileChange,
		} );

		expect( sideloadToServer ).toHaveBeenCalled();
		expect( onFileChange ).toHaveBeenCalled();
	} );

	it( 'should pass onProgress wrapper that includes the file', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		const onProgress = jest.fn();
		await sideloadMedia( {
			file: imageFile,
			attachmentId: 1,
			onError,
			onFileChange,
			onProgress,
		} );

		// sideloadToServer should receive a wrapper function.
		const passedOnProgress = ( sideloadToServer as jest.Mock ).mock
			.calls[ 0 ][ 4 ];
		expect( typeof passedOnProgress ).toBe( 'function' );

		// Calling the wrapper should invoke onProgress with progress and the file.
		passedOnProgress( 75 );
		expect( onProgress ).toHaveBeenCalledWith( 75, imageFile );
	} );

	it( 'should pass undefined when no onProgress is provided', async () => {
		const onError = jest.fn();
		const onFileChange = jest.fn();
		await sideloadMedia( {
			file: imageFile,
			attachmentId: 1,
			onError,
			onFileChange,
		} );

		expect( sideloadToServer ).toHaveBeenCalledWith(
			imageFile,
			1,
			expect.anything(),
			undefined,
			undefined
		);
	} );
} );
