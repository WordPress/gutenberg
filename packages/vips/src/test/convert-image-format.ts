import { convertImageFormat, compressImage } from '../';

const mockNewFromBuffer = jest.fn( () => new MockImage() );
const mockWriteToBuffer = jest.fn( () => ( {
	buffer: '',
} ) );

// Controls the `palette` metadata field reported by the mocked source image,
// which libvips sets for indexed sources.
let mockPalette = 0;

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	writeToBuffer = mockWriteToBuffer;
	getInt = jest.fn( ( name: string ) =>
		'palette' === name ? mockPalette : 0
	);
}

class MockVipsImage {
	static newFromBuffer = mockNewFromBuffer;
}

jest.mock( 'wasm-vips', () =>
	jest.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: jest.fn(),
		},
	} ) )
);

describe( 'convertImageFormat', () => {
	afterEach( () => {
		jest.clearAllMocks();
		mockPalette = 0;
	} );

	it( 'loads only the first frame when converting a GIF to JPEG', async () => {
		/*
		 * Regression test for https://github.com/WordPress/gutenberg/issues/80259.
		 * Loading an animated GIF with n=-1 produces a vertical strip image
		 * `frames × height` pixels tall. A JPEG cannot be animated, and
		 * libjpeg's 65,500 px dimension limit makes saving such a strip fail
		 * for long GIFs, so a still output must only decode the first frame.
		 */
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await convertImageFormat( 'itemId', buffer, 'image/gif', 'image/jpeg' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '', {} );
	} );

	it( 'loads all frames when converting a GIF to WebP', async () => {
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await convertImageFormat( 'itemId', buffer, 'image/gif', 'image/webp' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '[n=-1]', {
			n: -1,
		} );
	} );

	it( 'loads all frames when compressing a GIF in place', async () => {
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await compressImage( 'itemId', buffer, 'image/gif' );

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '[n=-1]', {
			n: -1,
		} );
	} );

	it( 'does not pass animation load options for still images', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await convertImageFormat(
			'itemId',
			buffer,
			'image/jpeg',
			'image/webp'
		);

		expect( mockNewFromBuffer ).toHaveBeenCalledWith( buffer, '', {} );
	} );

	describe( 'indexed (palette) PNG', () => {
		/*
		 * Regression tests for https://core.trac.wordpress.org/ticket/65922.
		 * libvips decodes an indexed PNG into RGB(A) pixels, so pngsave has to
		 * be told to quantise back down. Otherwise compressing or converting
		 * to PNG rewrites the image as truecolour and inflates it.
		 */
		it( 'quantises a compressed indexed PNG back to a palette', async () => {
			mockPalette = 1;
			const pngFile = new File( [ '<BLOB>' ], 'example.png', {
				type: 'image/png',
			} );
			const buffer = await pngFile.arrayBuffer();

			await compressImage( 'itemId', buffer, 'image/png' );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.objectContaining( { palette: true } )
			);
			// `Q` is pngsave's quantisation quality and only applies once
			// `palette` is on, so the lossy image quality must not leak in.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.not.objectContaining( { Q: expect.anything() } )
			);
		} );

		it( 'leaves a truecolour PNG unquantised', async () => {
			mockPalette = 0;
			const pngFile = new File( [ '<BLOB>' ], 'example.png', {
				type: 'image/png',
			} );
			const buffer = await pngFile.arrayBuffer();

			await compressImage( 'itemId', buffer, 'image/png' );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );

		it( 'does not quantise when converting an indexed source away from PNG', async () => {
			mockPalette = 1;
			const pngFile = new File( [ '<BLOB>' ], 'example.png', {
				type: 'image/png',
			} );
			const buffer = await pngFile.arrayBuffer();

			await convertImageFormat(
				'itemId',
				buffer,
				'image/png',
				'image/webp'
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.webp',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );
	} );
} );
