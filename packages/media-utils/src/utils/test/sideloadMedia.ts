/**
 * Internal dependencies
 */
import { sideloadMedia } from '../sideloadMedia';
import { sideloadToServer } from '../sideloadToServer';

jest.mock( '../sideloadToServer', () => ( {
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
} );
