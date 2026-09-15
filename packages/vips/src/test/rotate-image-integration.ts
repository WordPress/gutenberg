import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { rotateImage } from '../';

/**
 * Integration tests for EXIF-based rotation, using real fixture images with
 * known orientations — mirroring the rotated-image fixture set used by
 * WordPress core's PHPUnit media tests (test-image-rotated-90cw et al.).
 *
 * Like `highbitdepth-avif.ts`, this loads the real `wasm-vips` build instead
 * of a mock: whether libheif honors an EXIF orientation tag (it must not) and
 * whether the rotated output is written correctly can only be verified with
 * the actual decoder. `wasm-vips` is mocked to strip the browser-only loading
 * options (inlined-WASM Blob URLs) so the package's Node build is used.
 *
 * The fixtures are 64x32 landscape images, left half red and right half blue,
 * carrying their rotation in an EXIF orientation tag only (no native `irot`
 * transform). Generated with:
 *
 *     magick -size 32x32 xc:'#cc0000' -size 32x32 xc:'#0000cc' +append base.png
 *     magick base.png -quality 60 base.avif   # also base.heic, base.jpg
 *     exiftool -n -Orientation=6 -o exif-rotated-90cw.avif base.avif
 *     exiftool -n -Orientation=8 -o exif-rotated-90ccw.avif base.avif
 *     exiftool -n -Orientation=3 -o exif-upside-down.avif base.avif
 *     exiftool -n -Orientation=6 -o exif-rotated-90cw.heic base.heic
 *     exiftool -n -Orientation=6 -o exif-rotated-90cw.jpg base.jpg
 *
 * See https://github.com/WordPress/gutenberg/issues/79383.
 */

vi.mock( import( 'wasm-vips' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn( ( options: { dynamicLibraries?: string[] } = {} ) =>
			original.default( {
				dynamicLibraries: options.dynamicLibraries,
			} )
		) as unknown as typeof original.default,
	};
} );

/**
 * Returns a fixture URL relative to this ESM test module.
 *
 * @param file Fixture filename.
 *
 * @return Fixture URL.
 */
const getFixtureUrl = ( file: string ) =>
	new URL( `./fixtures/${ file }`, import.meta.url );

const loadFixture = ( file: string ): ArrayBuffer => {
	const contents = readFileSync( getFixtureUrl( file ) );
	return contents.buffer.slice(
		contents.byteOffset,
		contents.byteOffset + contents.byteLength
	) as ArrayBuffer;
};

// Dominant-channel comparisons so lossy compression noise is tolerated.
const isRed = ( [ r, , b ]: number[] ) => r > 128 && r > b;
const isBlue = ( [ r, , b ]: number[] ) => b > 128 && b > r;

/**
 * Colour type 3 in a PNG header means the image is palette (indexed) encoded.
 */
const PNG_COLOR_TYPE_INDEXED = 3;

/*
 * A PNG's IHDR chunk always comes first: an 8-byte signature, a 4-byte length,
 * the 4-byte chunk type, then width (4), height (4), bit depth (1) and colour
 * type (1). That puts the colour type at a fixed offset of 25.
 */
const pngColorType = ( bytes: Uint8Array ): number => bytes[ 25 ];

describe( 'rotateImage EXIF orientation fixtures', () => {
	let vips: Awaited< ReturnType< typeof VipsFactory > >;

	beforeAll( async () => {
		const { default: Vips } = await vi.importActual< {
			default: typeof VipsFactory;
		} >( 'wasm-vips' );
		vips = await Vips( { dynamicLibraries: [ 'vips-heif.wasm' ] } );
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	it.each( [
		[ 'AVIF', 'exif-rotated-90cw.avif' ],
		[ 'HEIC', 'exif-rotated-90cw.heic' ],
	] )(
		'confirms the premise: %s decoding ignores EXIF-only orientation',
		( _label, file ) => {
			// libheif/libvips only auto-rotate from a native `irot` transform.
			// If this ever starts honoring the EXIF tag (i.e. decodes as
			// 32x64 portrait), the client-side rotation in `generateThumbnails`
			// would double-rotate and must be revisited.
			const image = vips.Image.newFromBuffer( loadFixture( file ) );

			expect( image.width ).toBe( 64 );
			expect( image.height ).toBe( 32 );

			image.delete();
		}
	);

	// For each fixture, the physical rotation that makes the EXIF-tagged
	// image display upright, verified by where the red (originally left)
	// half of the pixels lands.
	it.each< [ string, string, number, { width: number; height: number } ] >( [
		// 90° CW: red left half becomes the top half.
		[
			'exif-rotated-90cw.avif',
			'image/avif',
			6,
			{ width: 32, height: 64 },
		],
		// 90° CCW: red left half becomes the bottom half.
		[
			'exif-rotated-90ccw.avif',
			'image/avif',
			8,
			{ width: 32, height: 64 },
		],
		// 180°: red left half becomes the right half.
		[ 'exif-upside-down.avif', 'image/avif', 3, { width: 64, height: 32 } ],
		// The server-readable format takes the same path in
		// `generateThumbnails` when rotating the original for sideloading.
		[ 'exif-rotated-90cw.jpg', 'image/jpeg', 6, { width: 32, height: 64 } ],
	] )(
		'rotates %s (%s, orientation %i) into an upright image',
		async ( file, mimeType, orientation, { width, height } ) => {
			const result = await rotateImage(
				'test-item',
				loadFixture( file ),
				mimeType,
				orientation
			);

			expect( result.width ).toBe( width );
			expect( result.height ).toBe( height );

			const rotated = vips.Image.newFromBuffer(
				result.buffer as ArrayBuffer
			);
			expect( rotated.width ).toBe( width );
			expect( rotated.height ).toBe( height );

			// Sample the midpoint of each half along the rotated axis.
			const halves =
				height > width
					? [
							rotated.getpoint( 16, 16 ), // Top.
							rotated.getpoint( 16, 48 ), // Bottom.
					  ]
					: [
							rotated.getpoint( 16, 16 ), // Left.
							rotated.getpoint( 48, 16 ), // Right.
					  ];

			const [ first, second ] =
				orientation === 6 ? halves : halves.reverse();
			expect( isRed( first ) ).toBe( true );
			expect( isBlue( second ) ).toBe( true );

			rotated.delete();
		}
	);

	// The unapplied EXIF orientation an image reports, defaulting to 1
	// (upright) when the metadata field is absent.
	const reportedOrientation = ( image: any ): number =>
		image.getTypeof( 'orientation' ) === 0
			? 1
			: image.getInt( 'orientation' );

	it( 'exposes the JPEG source tag as orientation metadata', () => {
		// Sanity check for the neutralize tests below: the JPEG loader (unlike
		// the HEIF one) surfaces the source EXIF tag, so without the strip in
		// `rotateImage` it would survive into the saved file.
		const source = vips.Image.newFromBuffer(
			loadFixture( 'exif-rotated-90cw.jpg' )
		);
		expect( reportedOrientation( source ) ).toBe( 6 );
		source.delete();
	} );

	it.each( [
		[ 'exif-rotated-90cw.jpg', 'image/jpeg' ],
		[ 'exif-rotated-90cw.avif', 'image/avif' ],
	] )(
		'neutralizes the EXIF orientation tag in the rotated %s output',
		async ( file, mimeType ) => {
			// The pixels are physically rotated, so a surviving orientation
			// tag would make EXIF-aware consumers rotate the image a second
			// time. (HEIF loads never populate the field, so for AVIF this
			// documents the safe default rather than guarding the strip.)
			const result = await rotateImage(
				'test-item',
				loadFixture( file ),
				mimeType,
				6
			);

			const rotated = vips.Image.newFromBuffer(
				result.buffer as ArrayBuffer
			);
			expect( reportedOrientation( rotated ) ).toBe( 1 );
			rotated.delete();
		}
	);

	it( 'keeps a rotated indexed PNG indexed', async () => {
		/*
		 * Rotating is the third path that writes a PNG, alongside resizing and
		 * converting. It writes the full-size file, so dropping the palette
		 * here inflates the image the user actually uploaded.
		 * See https://github.com/WordPress/gutenberg/issues/81895.
		 */
		const source = vips.Image.newFromBuffer(
			loadFixture( 'exif-rotated-90cw.jpg' )
		);
		const indexedPng: Uint8Array = source.writeToBuffer( '.png', {
			palette: true,
		} );
		source.delete();

		// Premise check: the generated source really is indexed, so a
		// truecolour result below can only come from the rotation.
		expect( pngColorType( indexedPng ) ).toBe( PNG_COLOR_TYPE_INDEXED );

		const result = await rotateImage(
			'test-item',
			indexedPng.buffer as ArrayBuffer,
			'image/png',
			6
		);

		expect( pngColorType( new Uint8Array( result.buffer ) ) ).toBe(
			PNG_COLOR_TYPE_INDEXED
		);
	} );
} );
