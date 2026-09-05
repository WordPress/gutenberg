import { afterEach, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { convertImageFormat, compressImage } from '../';

const { MockVipsImage, mockNewFromBuffer, mockState, mockWriteToBuffer } =
	vi.hoisted( () => {
		/*
		 * Controls whether the mocked source image reports the `palette` metadata
		 * field, which libvips attaches only for indexed sources.
		 */
		const state: { bitdepth: number | undefined; hasPalette: boolean } = {
			bitdepth: undefined,
			hasPalette: false,
		};

		// GType of `gint`. Only whether `getTypeof` returns non-zero matters here.
		const G_TYPE_INT = 24;

		const writeToBufferMock = vi.fn( () => ( {
			buffer: '',
		} ) );

		class ImageMock {
			width = 100;
			height = 100;
			pageHeight = 100;
			writeToBuffer = writeToBufferMock;
			/*
			 * Mirrors libvips: reading a field the image does not carry throws
			 * rather than returning a falsy default. The production helpers rely
			 * on that, so the mock has to throw too or their fallbacks would
			 * never be exercised.
			 */
			getInt = vi.fn( ( name: string ) => {
				if (
					'heif-bitdepth' === name &&
					undefined !== state.bitdepth
				) {
					return state.bitdepth;
				}
				throw new Error( `${ name }: no such field` );
			} );
			/*
			 * libvips only attaches `palette` when the source was indexed, so
			 * presence is the signal. Absent fields report GType 0 rather than
			 * throwing.
			 */
			getTypeof = vi.fn( ( name: string ) =>
				'palette' === name && state.hasPalette ? G_TYPE_INT : 0
			);
		}

		const newFromBufferMock = vi.fn( () => new ImageMock() );

		class VipsImageMock {
			static newFromBuffer = newFromBufferMock;
		}

		return {
			MockVipsImage: VipsImageMock,
			mockNewFromBuffer: newFromBufferMock,
			mockState: state,
			mockWriteToBuffer: writeToBufferMock,
		};
	} );

vi.mock( import( 'wasm-vips' ), () => ( {
	default: vi.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: vi.fn(),
		},
	} ) ) as unknown as typeof VipsFactory,
} ) );

describe( 'convertImageFormat', () => {
	afterEach( () => {
		vi.clearAllMocks();
		mockState.hasPalette = false;
		mockState.bitdepth = undefined;
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
			mockState.hasPalette = true;
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
			// libvips attaches `palette` only for an indexed source, so a
			// truecolour PNG carries no such field.
			mockState.hasPalette = false;
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
			mockState.hasPalette = true;
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

	describe( 'image_strip_meta', () => {
		it( 'keeps color profiles and gain maps by default', async () => {
			const file = new File( [ '<BLOB>' ], 'example.jpeg', {
				type: 'image/jpeg',
			} );

			await compressImage(
				'itemId',
				await file.arrayBuffer(),
				'image/jpeg'
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'icc|gainmap' } )
			);
		} );

		it( 'keeps all metadata when stripping is disabled', async () => {
			const file = new File( [ '<BLOB>' ], 'example.jpeg', {
				type: 'image/jpeg',
			} );

			await compressImage(
				'itemId',
				await file.arrayBuffer(),
				'image/jpeg',
				{ stripMeta: false }
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'all' } )
			);
		} );
	} );

	describe( 'image_max_bit_depth', () => {
		it( 'writes the capped depth when the cap flattens a 12-bit source', async () => {
			mockState.bitdepth = 12;
			const file = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );

			await compressImage(
				'itemId',
				await file.arrayBuffer(),
				'image/avif',
				{ maxBitdepth: 8 }
			);

			// heifsave defaults to 12-bit for 16-bit pixel data, so the depth
			// has to be written out even when the cap resolves to 8.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 8 } )
			);
		} );

		it( 'writes no bit depth for a standard-depth source', async () => {
			const file = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );

			await compressImage(
				'itemId',
				await file.arrayBuffer(),
				'image/avif'
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.not.objectContaining( { bitdepth: expect.anything() } )
			);
		} );
	} );

	describe( 'image_save_progressive', () => {
		it( 'writes a progressive JPEG when interlacing is requested', async () => {
			const file = new File( [ '<BLOB>' ], 'example.jpeg', {
				type: 'image/jpeg',
			} );

			await compressImage(
				'itemId',
				await file.arrayBuffer(),
				'image/jpeg',
				{ interlaced: true }
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { interlace: true } )
			);
		} );
	} );
} );
