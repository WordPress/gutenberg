import { afterEach, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { resizeImage } from '../';
import type { ImageSizeCrop } from '../types';

const {
	MockVipsImage,
	mockCrop,
	mockResize,
	mockState,
	mockThumbnailBuffer,
	mockWriteToBuffer,
} = vi.hoisted( () => {
	/*
	 * Controls the metadata fields reported by the mocked source image.
	 * `undefined` means the field is absent, which is the common case: a JPEG
	 * carries neither `heif-bitdepth` nor `palette`.
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
		crop = cropMock;
		resize = resizeMock;
		writeToBuffer = writeToBufferMock;
		/*
		 * Mirrors libvips: reading a field the image does not carry throws rather
		 * than returning a falsy default. The production helpers rely on that, so
		 * the mock has to throw too or their fallbacks would never be exercised.
		 */
		getInt = vi.fn( ( name: string ) => {
			if ( 'heif-bitdepth' === name && undefined !== state.bitdepth ) {
				return state.bitdepth;
			}
			throw new Error( `${ name }: no such field` );
		} );
		/*
		 * libvips only attaches `palette` when the source was indexed, so presence
		 * is the signal. Absent fields report GType 0 rather than throwing.
		 */
		getTypeof = vi.fn( ( name: string ) =>
			'palette' === name && state.hasPalette ? G_TYPE_INT : 0
		);
	}

	const thumbnailBufferMock = vi.fn( () => new ImageMock() );
	const cropMock = vi.fn( () => new ImageMock() );
	const resizeMock = vi.fn( () => new ImageMock() );
	const newFromBufferMock = vi.fn( () => new ImageMock() );

	class VipsImageMock {
		static thumbnailBuffer = thumbnailBufferMock;
		static newFromBuffer = newFromBufferMock;
	}

	return {
		MockVipsImage: VipsImageMock,
		mockCrop: cropMock,
		mockResize: resizeMock,
		mockState: state,
		mockThumbnailBuffer: thumbnailBufferMock,
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

describe( 'resizeImage', () => {
	afterEach( () => {
		vi.clearAllMocks();
		mockState.bitdepth = undefined;
		mockState.hasPalette = false;
	} );

	it( 'resizes without crop', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 100,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes without crop and zero height', async () => {
		const jpegFile = new File( [], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 0,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			size: 'down',
			height: 100,
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes animated images from the first frame only', async () => {
		const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
			lastModified: 1234567891,
			type: 'image/gif',
		} );
		const buffer = await gifFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/gif', {
			width: 100,
			height: 100,
		} );

		/*
		 * Sub-sizes of animated images are static, generated from the first
		 * frame, matching WordPress core's server-side behavior. All frames
		 * must NOT be loaded (no `option_string: '[n=-1]'`), which used to
		 * re-encode a full animated GIF per sub-size.
		 */
		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 100,
			crop: true,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			crop: 'centre',
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop and zero height', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 100,
			height: 0,
			crop: true,
		} );

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			crop: 'centre',
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes without crop and attention strategy', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage(
			'itemId',
			buffer,
			'image/jpeg',
			{
				width: 100,
				height: 100,
			},
			{ smartCrop: true }
		);

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it( 'resizes with center crop and attention strategy', async () => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage(
			'itemId',
			buffer,
			'image/jpeg',
			{
				width: 100,
				height: 100,
				crop: true,
			},
			{ smartCrop: true }
		);

		expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
			height: 100,
			crop: 'attention',
			size: 'down',
		} );
		expect( mockCrop ).not.toHaveBeenCalled();
	} );

	it.each< [ ImageSizeCrop[ 'crop' ], [ number, number, number, number ] ] >(
		[
			[
				[ 'left', 'top' ],
				[ 0, 0, 25, 25 ],
			],
			[
				[ 'center', 'top' ],
				[ 37.5, 0, 25, 25 ],
			],
			[
				[ 'right', 'top' ],
				[ 75, 0, 25, 25 ],
			],
			[
				[ 'left', 'center' ],
				[ 0, 37.5, 25, 25 ],
			],
			[
				[ 'center', 'center' ],
				[ 37.5, 37.5, 25, 25 ],
			],
			[
				[ 'right', 'center' ],
				[ 75, 37.5, 25, 25 ],
			],
			[
				[ 'left', 'bottom' ],
				[ 0, 75, 25, 25 ],
			],
			[
				[ 'center', 'bottom' ],
				[ 37.5, 75, 25, 25 ],
			],
			[
				[ 'right', 'bottom' ],
				[ 75, 75, 25, 25 ],
			],
		]
	)( 'resizes with %s param and crops %s', async ( crop, expected ) => {
		const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
			lastModified: 1234567891,
			type: 'image/jpeg',
		} );
		const buffer = await jpegFile.arrayBuffer();

		await resizeImage( 'itemId', buffer, 'image/jpeg', {
			width: 25,
			height: 25,
			crop,
		} );

		expect( mockCrop ).toHaveBeenCalledWith( ...expected );
	} );

	describe( 'high-bit-depth AVIF', () => {
		it( 'preserves bit depth when resizing a 10-bit AVIF without crop', async () => {
			mockState.bitdepth = 10;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
			} );

			// Uses the precision-preserving resize path, not `thumbnail`
			// (which would flatten the samples to 8-bit sRGB).
			expect( mockResize ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			// Writes the source bit depth so the sub-size stays 10-bit.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );

		it( 'centre-crops a 12-bit AVIF while preserving bit depth', async () => {
			mockState.bitdepth = 12;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
				crop: true,
			} );

			expect( mockResize ).toHaveBeenCalled();
			expect( mockCrop ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 12 } )
			);
		} );

		it( 'crops a 10-bit AVIF to a position while preserving bit depth', async () => {
			mockState.bitdepth = 10;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
				crop: [ 'right', 'top' ],
			} );

			// Positional crops resize on the precision-preserving path and
			// then crop the offset region directly on the 16-bit image.
			expect( mockResize ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			expect( mockCrop ).toHaveBeenCalledWith( 50, 0, 50, 50 );
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );

		it( 'uses the standard thumbnail path for an 8-bit AVIF', async () => {
			mockState.bitdepth = 8;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/avif', {
				width: 50,
				height: 50,
			} );

			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( mockResize ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.not.objectContaining( { bitdepth: expect.anything() } )
			);
		} );
	} );

	describe( 'image_strip_meta', () => {
		it( 'strips metadata except color profiles and gain maps by default', async () => {
			const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
				type: 'image/jpeg',
			} );
			const buffer = await jpegFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/jpeg', {
				width: 100,
				height: 100,
			} );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'icc|gainmap' } )
			);
		} );

		it( 'keeps all metadata when stripping is disabled', async () => {
			const jpegFile = new File( [ '<BLOB>' ], 'example.jpg', {
				type: 'image/jpeg',
			} );
			const buffer = await jpegFile.arrayBuffer();

			await resizeImage(
				'itemId',
				buffer,
				'image/jpeg',
				{
					width: 100,
					height: 100,
				},
				{ stripMeta: false }
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.jpeg',
				expect.objectContaining( { keep: 'all' } )
			);
		} );
	} );

	describe( 'image_max_bit_depth', () => {
		it( 'caps a 12-bit AVIF at 10-bit', async () => {
			mockState.bitdepth = 12;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage(
				'itemId',
				buffer,
				'image/avif',
				{
					width: 50,
					height: 50,
				},
				{ maxBitdepth: 10 }
			);

			// Still high-bit-depth, so the precision-preserving path is used.
			expect( mockResize ).toHaveBeenCalled();
			expect( mockThumbnailBuffer ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );

		it( 'snaps an unsupported cap down to the nearest valid depth', async () => {
			mockState.bitdepth = 12;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage(
				'itemId',
				buffer,
				'image/avif',
				{
					width: 50,
					height: 50,
				},
				{ maxBitdepth: 11 } // AVIF only supports 8, 10, and 12.
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );

		it( 'flattens a 10-bit AVIF via the thumbnail path when capped at 8-bit', async () => {
			mockState.bitdepth = 10;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage(
				'itemId',
				buffer,
				'image/avif',
				{
					width: 50,
					height: 50,
				},
				{ maxBitdepth: 8 }
			);

			// An 8-bit result does not need the precision-preserving path,
			// so the regular colour-managed thumbnail path is used.
			expect( mockThumbnailBuffer ).toHaveBeenCalled();
			expect( mockResize ).not.toHaveBeenCalled();
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.not.objectContaining( { bitdepth: expect.anything() } )
			);
		} );

		it( 'ignores the cap for sources at or below it', async () => {
			mockState.bitdepth = 10;
			const avifFile = new File( [ '<BLOB>' ], 'example.avif', {
				type: 'image/avif',
			} );
			const buffer = await avifFile.arrayBuffer();

			await resizeImage(
				'itemId',
				buffer,
				'image/avif',
				{
					width: 50,
					height: 50,
				},
				{ maxBitdepth: 12 }
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.avif',
				expect.objectContaining( { bitdepth: 10 } )
			);
		} );
	} );
	describe( 'indexed (palette) PNG', () => {
		/*
		 * Regression tests for https://core.trac.wordpress.org/ticket/65922.
		 * libvips decodes an indexed PNG into RGB(A) pixels, so pngsave has to
		 * be told to quantise back down. Otherwise every sub-size is written
		 * as truecolour and can be larger than the indexed original.
		 */
		it( 'quantises sub-sizes of an indexed PNG back to a palette', async () => {
			mockState.hasPalette = true;
			const pngFile = new File( [ '<BLOB>' ], 'example.png', {
				type: 'image/png',
			} );
			const buffer = await pngFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/png', {
				width: 50,
				height: 50,
			} );

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

			await resizeImage( 'itemId', buffer, 'image/png', {
				width: 50,
				height: 50,
			} );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.png',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );

		it( 'does not quantise non-PNG output from an indexed source', async () => {
			// A GIF is always indexed, but only pngsave takes `palette`.
			mockState.hasPalette = true;
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			await resizeImage( 'itemId', buffer, 'image/gif', {
				width: 50,
				height: 50,
			} );

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( { palette: expect.anything() } )
			);
		} );
	} );
} );
