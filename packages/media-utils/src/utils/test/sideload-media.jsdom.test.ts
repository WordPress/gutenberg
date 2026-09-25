import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { sideloadMedia } from '../sideload-media';
import { sideloadToServer } from '../sideload-to-server';

vi.mock( import( '../sideload-to-server' ), () => ( {
	sideloadToServer: vi.fn(),
} ) );

const imageFile = new window.File( [ 'fake_file' ], 'test.jpeg', {
	type: 'image/jpeg',
} );

describe( 'sideloadMedia', () => {
	afterEach( () => {
		vi.clearAllMocks();
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
		( sideloadToServer as Mock ).mockResolvedValue( mockSubSizeData );

		const onError = vi.fn();
		const onSuccess = vi.fn();
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
