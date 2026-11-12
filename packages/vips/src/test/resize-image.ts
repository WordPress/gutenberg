import { afterEach, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { resizeImage } from '../';
import type { ImageSizeCrop } from '../types';

const {
	MockVipsImage,
	MockImage,
	mockArrayjoin,
	mockCrop,
	mockResize,
	mockSmartcrop,
	mockState,
	mockThumbnailBuffer,
	mockWriteToBuffer,
} = vi.hoisted( () => {
	/*
	 * Controls the metadata fields reported by the mocked source image.
	 * `undefined` means the field is absent, which is the common case: a JPEG
	 * carries neither `heif-bitdepth` nor `palette`.
	 */
	const state: {
		bitdepth: number | undefined;
		hasPalette: boolean;
		width: number;
		height: number;
		pageHeight: number;
	} = {
		bitdepth: undefined,
		hasPalette: false,
		/*
		 * `height` is the full "toilet roll" height of an image loaded with
		 * `[n=-1]`, so `height / pageHeight` is the frame count, which drives
		 * the animation memory estimate.
		 */
		width: 100,
		height: 100,
		pageHeight: 100,
	};

	// GType of `gint`. Only whether `getTypeof` returns non-zero matters here.
	const G_TYPE_INT = 24;

	const writeToBufferMock = vi.fn( () => ( {
		buffer: '',
	} ) );

	class ImageMock {
		width = state.width;
		height = state.height;
		pageHeight = state.pageHeight;
		xoffset = 0;
		yoffset = 0;
		crop = cropMock;
		resize = resizeMock;
		smartcrop = smartcropMock;
		copy = vi.fn( () => this );
		setInt = vi.fn();
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
	const smartcropMock = vi.fn( () => new ImageMock() );
	const arrayjoinMock = vi.fn( () => new ImageMock() );
	const newFromBufferMock = vi.fn( () => new ImageMock() );

	class VipsImageMock {
		static thumbnailBuffer = thumbnailBufferMock;
		static newFromBuffer = newFromBufferMock;
		static arrayjoin = arrayjoinMock;
	}

	return {
		MockVipsImage: VipsImageMock,
		MockImage: ImageMock,
		mockArrayjoin: arrayjoinMock,
		mockCrop: cropMock,
		mockResize: resizeMock,
		mockSmartcrop: smartcropMock,
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
		mockState.width = 100;
		mockState.height = 100;
		mockState.pageHeight = 100;
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

	it( 'resizes animated images from the first frame only by default', async () => {
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

	describe( 'preserveAnimation', () => {
		it( 'loads all frames and tunes gifsave for uncropped animated resizes', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			// Three frames stacked into one 300px-tall image.
			mockState.height = 300;

			await resizeImage(
				'itemId',
				buffer,
				'image/gif',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
				height: 100,
				size: 'down',
				option_string: '[n=-1]',
			} );
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.objectContaining( {
					effort: 2,
					interframe_maxerror: 8,
				} )
			);
			/*
			 * `interpalette_maxerror` stays at the libvips default: raising it
			 * makes frames reuse a palette that no longer fits when the colours
			 * shift, which costs encode time and visible colour accuracy for a
			 * negligible size saving.
			 */
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( {
					interpalette_maxerror: expect.anything(),
				} )
			);
		} );

		it( 'loads all frames of an uncropped animated WebP', async () => {
			const webpFile = new File( [ '<BLOB>' ], 'example.webp', {
				lastModified: 1234567891,
				type: 'image/webp',
			} );
			const buffer = await webpFile.arrayBuffer();

			// Three frames stacked into one 300px-tall image.
			mockState.height = 300;

			await resizeImage(
				'itemId',
				buffer,
				'image/webp',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
				height: 100,
				size: 'down',
				option_string: '[n=-1]',
			} );
			// The gifsave tuning does not apply to webpsave.
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.webp',
				expect.not.objectContaining( {
					interframe_maxerror: expect.anything(),
				} )
			);
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.webp',
				expect.not.objectContaining( {
					effort: expect.anything(),
				} )
			);
		} );

		describe( 'cropped sizes', () => {
			const resizeAnimation = async (
				crop: ImageSizeCrop[ 'crop' ],
				smartCrop = false,
				type: 'image/gif' | 'image/webp' = 'image/gif'
			) => {
				const file = new File( [ '<BLOB>' ], 'example', {
					lastModified: 1234567891,
					type,
				} );
				const buffer = await file.arrayBuffer();

				// Three 200x100 frames stacked into one 300px-tall image.
				mockState.width = 200;
				mockState.height = 300;
				mockState.pageHeight = 100;

				const result = await resizeImage(
					'itemId',
					buffer,
					type,
					{ width: 100, height: 100, crop },
					{ preserveAnimation: true, smartCrop }
				);

				return { buffer, result };
			};

			it( 'scales the animation to cover the size without cropping it', async () => {
				const { buffer } = await resizeAnimation( true );

				/*
				 * `thumbnail` would flatten a cropped animation to its first
				 * frame, so it only resizes here.
				 */
				expect( mockThumbnailBuffer ).toHaveBeenCalledTimes( 1 );
				expect( mockThumbnailBuffer ).toHaveBeenCalledWith(
					buffer,
					200,
					{
						height: 100,
						size: 'down',
						option_string: '[n=-1]',
					}
				);
			} );

			it( 'centre-crops every frame with the same rectangle', async () => {
				await resizeAnimation( true );

				expect( mockCrop.mock.calls ).toEqual( [
					[ 50, 0, 100, 100 ],
					[ 50, 100, 100, 100 ],
					[ 50, 200, 100, 100 ],
				] );
				expect( mockArrayjoin ).toHaveBeenCalledWith(
					[
						expect.any( Object ),
						expect.any( Object ),
						expect.any( Object ),
					],
					{ across: 1 }
				);
				const joined = mockArrayjoin.mock.results[ 0 ].value;
				expect( joined.setInt ).toHaveBeenCalledWith(
					'page-height',
					100
				);
			} );

			it( 'crops every frame at a fixed position', async () => {
				await resizeAnimation( [ 'right', 'top' ] );

				expect( mockCrop.mock.calls ).toEqual( [
					[ 100, 0, 100, 100 ],
					[ 100, 100, 100, 100 ],
					[ 100, 200, 100, 100 ],
				] );
			} );

			it( 'picks the smart crop from the first frame and applies it to all of them', async () => {
				mockSmartcrop.mockImplementationOnce( () =>
					Object.assign( new MockImage(), { xoffset: -30 } )
				);

				await resizeAnimation( true, true );

				expect( mockSmartcrop ).toHaveBeenCalledTimes( 1 );
				expect( mockSmartcrop ).toHaveBeenCalledWith( 100, 100, {
					interesting: 'attention',
				} );
				expect( mockCrop.mock.calls ).toEqual( [
					[ 0, 0, 200, 100 ],
					[ 30, 0, 100, 100 ],
					[ 30, 100, 100, 100 ],
					[ 30, 200, 100, 100 ],
				] );
			} );

			it( 'tunes gifsave for the cropped animation', async () => {
				await resizeAnimation( true );

				expect( mockWriteToBuffer ).toHaveBeenCalledWith(
					'.gif',
					expect.objectContaining( {
						effort: 2,
						interframe_maxerror: 8,
					} )
				);
			} );

			it( 'crops every frame of an animated WebP with the same rectangle', async () => {
				const { buffer } = await resizeAnimation(
					true,
					false,
					'image/webp'
				);

				expect( mockThumbnailBuffer ).toHaveBeenCalledWith(
					buffer,
					200,
					{
						height: 100,
						size: 'down',
						option_string: '[n=-1]',
					}
				);
				expect( mockCrop.mock.calls ).toEqual( [
					[ 50, 0, 100, 100 ],
					[ 50, 100, 100, 100 ],
					[ 50, 200, 100, 100 ],
				] );
				const joined = mockArrayjoin.mock.results[ 0 ].value;
				expect( joined.setInt ).toHaveBeenCalledWith(
					'page-height',
					100
				);
				expect( mockWriteToBuffer ).toHaveBeenCalledWith(
					'.webp',
					expect.not.objectContaining( {
						interframe_maxerror: expect.anything(),
					} )
				);
			} );

			it( 'crops a single-frame GIF as a still image', async () => {
				const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
					lastModified: 1234567891,
					type: 'image/gif',
				} );
				const buffer = await gifFile.arrayBuffer();

				await resizeImage(
					'itemId',
					buffer,
					'image/gif',
					{ width: 100, height: 100, crop: true },
					{ preserveAnimation: true }
				);

				expect( mockThumbnailBuffer ).toHaveBeenCalledWith(
					buffer,
					100,
					{
						height: 100,
						crop: 'centre',
						size: 'down',
						option_string: '[n=-1]',
					}
				);
				expect( mockArrayjoin ).not.toHaveBeenCalled();
			} );
		} );

		it( 'leaves gifsave at its defaults for a static GIF', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			/*
			 * The mocked image reports a single frame (height === pageHeight).
			 * The inter-frame and inter-palette tolerances are meaningless for
			 * one frame, so a static GIF uploaded to an opted-in site must not
			 * pay libvips' default `effort` in worse compression.
			 */
			await resizeImage(
				'itemId',
				buffer,
				'image/gif',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( {
					effort: expect.anything(),
				} )
			);
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( {
					interframe_maxerror: expect.anything(),
				} )
			);
		} );

		it( 'keeps an animation the 1 GiB heap budget flattened', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			// 150 frames of 1200x900 need ~650 MB, over the old ~0.5 GiB budget.
			mockState.width = 1200;
			mockState.pageHeight = 900;
			mockState.height = 900 * 150;

			await resizeImage(
				'itemId',
				buffer,
				'image/gif',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
				height: 100,
				size: 'down',
				option_string: '[n=-1]',
			} );
		} );

		it( 'falls back to the first frame when the animation exceeds the memory budget', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			/*
			 * A 1200x900 GIF is only ~4 MB decoded as a single frame, but 250
			 * frames of it need ~1.1 GB, which does not fit the animation
			 * memory budget. Such an animation must flatten rather than abort
			 * the upload.
			 */
			mockState.width = 1200;
			mockState.pageHeight = 900;
			mockState.height = 900 * 250;

			await resizeImage(
				'itemId',
				buffer,
				'image/gif',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			expect( mockThumbnailBuffer ).toHaveBeenCalledWith( buffer, 100, {
				height: 100,
				size: 'down',
			} );
			expect( mockWriteToBuffer ).toHaveBeenCalledWith(
				'.gif',
				expect.not.objectContaining( {
					interframe_maxerror: expect.anything(),
				} )
			);
			/*
			 * The site opted in, so a silent flatten would look like the
			 * filter had no effect. The warning names the frame count and the
			 * budget it was measured against.
			 */
			expect( console ).toHaveWarnedWith(
				expect.stringContaining( '250 frames' )
			);
		} );

		it( 'falls back to the first frame when a later frame fails to decode', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			mockState.height = 100 * 4;
			const decodeError = new Error(
				'unable to call VipsForeignSaveCgifTarget'
			);
			mockWriteToBuffer.mockImplementationOnce( () => {
				throw decodeError;
			} );

			await resizeImage(
				'itemId',
				buffer,
				'image/gif',
				{
					width: 100,
					height: 100,
				},
				{ preserveAnimation: true }
			);

			// The retry loads the first frame only, with gifsave defaults.
			expect( mockThumbnailBuffer ).toHaveBeenLastCalledWith(
				buffer,
				100,
				{
					height: 100,
					size: 'down',
				}
			);
			expect( mockWriteToBuffer ).toHaveBeenCalledTimes( 2 );
			expect( mockWriteToBuffer ).toHaveBeenLastCalledWith(
				'.gif',
				expect.not.objectContaining( {
					interframe_maxerror: expect.anything(),
				} )
			);
			expect( console ).toHaveWarnedWith(
				expect.stringContaining( 'could not be decoded' ),
				decodeError
			);
		} );

		it( 'rethrows encoder errors when not preserving animation', async () => {
			const gifFile = new File( [ '<BLOB>' ], 'example.gif', {
				lastModified: 1234567891,
				type: 'image/gif',
			} );
			const buffer = await gifFile.arrayBuffer();

			mockWriteToBuffer.mockImplementationOnce( () => {
				throw new Error( 'encode failed' );
			} );

			await expect(
				resizeImage( 'itemId', buffer, 'image/gif', {
					width: 100,
					height: 100,
				} )
			).rejects.toThrow( 'encode failed' );
			expect( mockWriteToBuffer ).toHaveBeenCalledTimes( 1 );
		} );

		/*
		 * APNG and AVIF image sequences are animated too, but the bundled
		 * libvips cannot keep their frames, so they flatten like a still.
		 */
		it.each( [ 'image/jpeg', 'image/png', 'image/avif' ] )(
			'has no effect on %s',
			async ( type ) => {
				const file = new File( [ '<BLOB>' ], 'example', {
					lastModified: 1234567891,
					type,
				} );
				const buffer = await file.arrayBuffer();

				await resizeImage(
					'itemId',
					buffer,
					type,
					{
						width: 100,
						height: 100,
					},
					{ preserveAnimation: true }
				);

				expect( mockThumbnailBuffer ).toHaveBeenCalledWith(
					buffer,
					100,
					{
						height: 100,
						size: 'down',
					}
				);
				expect( mockArrayjoin ).not.toHaveBeenCalled();
				expect( mockWriteToBuffer ).toHaveBeenCalledWith(
					`.${ type.split( '/' )[ 1 ] }`,
					expect.not.objectContaining( {
						interframe_maxerror: expect.anything(),
					} )
				);
			}
		);
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
