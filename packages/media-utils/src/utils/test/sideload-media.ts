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

	it( 'should sideload to server and call onSuccess with sub-size data', async () => {
		const mockSubSizeData = {
			image_size: 'thumbnail',
			width: 150,
			height: 150,
			file: 'test-150x150.jpeg',
			mime_type: 'image/jpeg',
			filesize: 5000,
		};
		( sideloadToServer as jest.Mock ).mockResolvedValue( mockSubSizeData );

		const onError = jest.fn();
		const onSuccess = jest.fn();
		await sideloadMedia( {
			file: imageFile,
			attachmentId: 1,
			onError,
			onSuccess,
		} );

		expect( sideloadToServer ).toHaveBeenCalled();
		expect( onSuccess ).toHaveBeenCalledWith( mockSubSizeData );
	} );
} );
