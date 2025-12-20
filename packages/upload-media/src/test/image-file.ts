/**
 * Internal dependencies
 */
import { ImageFile } from '../image-file';

describe( 'ImageFile', () => {
	it( 'returns whether the file was resizes', () => {
		const file = new window.File( [ 'fake_file' ], 'test.jpeg', {
			type: 'image/jpeg',
		} );

		const image = new ImageFile( file, 1000, 1000, 2000, 200 );
		expect( image.wasResized ).toBe( true );
	} );
} );
