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

	it( 'should pass onProgress callback to sideloadToServer', async () => {
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

		expect( sideloadToServer ).toHaveBeenCalledWith(
			imageFile,
			1,
			expect.anything(),
			undefined,
			onProgress
		);
	} );
} );
