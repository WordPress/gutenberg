import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { editImage } from '../';

/**
 * Integration tests for image edits (flip, rotate, crop), using the real
 * `wasm-vips` build. The edits have to land on the same pixels as the REST
 * `/edit` endpoint's server-side editors do, and rotation direction, crop
 * frame after a rotation, EXIF handling and gain map handling can only be
 * verified with the actual library.
 *
 * Like `rotate-image-integration.ts`, `wasm-vips` is mocked to strip the
 * browser-only loading options so the package's Node build is used.
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

const getFixtureUrl = ( file: string ) =>
	new URL( `./fixtures/${ file }`, import.meta.url );

const loadFixture = ( file: string ): ArrayBuffer => {
	const contents = readFileSync( getFixtureUrl( file ) );
	return contents.buffer.slice(
		contents.byteOffset,
		contents.byteOffset + contents.byteLength
	) as ArrayBuffer;
};

const toArrayBuffer = ( bytes: Uint8Array ): ArrayBuffer =>
	bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength
	) as ArrayBuffer;

// Dominant-channel comparisons so lossy compression noise is tolerated.
const isRed = ( [ r, , b ]: number[] ) => r > 128 && r > b;
const isBlue = ( [ r, , b ]: number[] ) => b > 128 && b > r;

describe( 'editImage with real images', () => {
	let vips: Awaited< ReturnType< typeof VipsFactory > >;
	// A 64x32 landscape JPEG, left half red and right half blue, without
	// any EXIF orientation.
	let redBlue: ArrayBuffer;

	beforeAll( async () => {
		const { default: Vips } = await vi.importActual< {
			default: typeof VipsFactory;
		} >( 'wasm-vips' );
		vips = await Vips( { dynamicLibraries: [ 'vips-heif.wasm' ] } );

		const red = vips.Image.black( 32, 32, { bands: 3 } ).add( [
			204, 0, 0,
		] );
		const blue = vips.Image.black( 32, 32, { bands: 3 } ).add( [
			0, 0, 204,
		] );
		const joined = red.join( blue, 'horizontal' );
		redBlue = toArrayBuffer(
			joined.writeToBuffer( '.jpg', { Q: 90 } ) as Uint8Array
		);
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	const decode = ( result: { buffer: ArrayBuffer | ArrayBufferLike } ) =>
		vips.Image.newFromBuffer( result.buffer as ArrayBuffer );

	it( 'flips horizontally', async () => {
		const result = await editImage( 'item', redBlue, 'image/jpeg', [
			{
				type: 'flip',
				args: { flip: { horizontal: true, vertical: false } },
			},
		] );

		expect( result.width ).toBe( 64 );
		expect( result.height ).toBe( 32 );

		const image = decode( result );
		expect( isBlue( image.getpoint( 16, 16 ) ) ).toBe( true );
		expect( isRed( image.getpoint( 48, 16 ) ) ).toBe( true );
		image.delete();
	} );

	it( 'rotates clockwise for a positive angle, as the /edit endpoint does', async () => {
		// The endpoint's `angle` is clockwise-positive: the red left half
		// must end up on top.
		const result = await editImage( 'item', redBlue, 'image/jpeg', [
			{ type: 'rotate', args: { angle: 90 } },
		] );

		expect( result.width ).toBe( 32 );
		expect( result.height ).toBe( 64 );

		const image = decode( result );
		expect( isRed( image.getpoint( 16, 16 ) ) ).toBe( true );
		expect( isBlue( image.getpoint( 16, 48 ) ) ).toBe( true );
		image.delete();
	} );

	it( 'rotates by an arbitrary angle onto the rotated bounding box', async () => {
		const result = await editImage( 'item', redBlue, 'image/jpeg', [
			{ type: 'rotate', args: { angle: 30 } },
		] );

		// 64 cos30 + 32 sin30 = 71.4, 64 sin30 + 32 cos30 = 59.7.
		expect( result.width ).toBeGreaterThanOrEqual( 71 );
		expect( result.width ).toBeLessThanOrEqual( 72 );
		expect( result.height ).toBeGreaterThanOrEqual( 59 );
		expect( result.height ).toBeLessThanOrEqual( 60 );

		// The exposed corners are white, matching core's GD editor.
		const image = decode( result );
		const [ r, g, b ] = image.getpoint( 1, 1 );
		expect( r ).toBeGreaterThan( 240 );
		expect( g ).toBeGreaterThan( 240 );
		expect( b ).toBeGreaterThan( 240 );
		image.delete();
	} );

	it( 'crops by percentages of the frame the crop is applied to', async () => {
		// Rotate first, then keep the top half: the crop percentages refer
		// to the rotated 32x64 frame, so this keeps the (red) top 32 rows.
		const result = await editImage( 'item', redBlue, 'image/jpeg', [
			{ type: 'rotate', args: { angle: 90 } },
			{
				type: 'crop',
				args: { left: 0, top: 0, width: 100, height: 50 },
			},
		] );

		expect( result.width ).toBe( 32 );
		expect( result.height ).toBe( 32 );

		const image = decode( result );
		expect( isRed( image.getpoint( 8, 8 ) ) ).toBe( true );
		expect( isRed( image.getpoint( 24, 24 ) ) ).toBe( true );
		image.delete();
	} );

	it( 'applies a pending EXIF orientation before editing, then drops the tag', async () => {
		// The fixture stores 64x32 pixels with the red half on the left and
		// an orientation tag of 6, so it displays as a 32x64 portrait with
		// red on top. The endpoint edits in that displayed frame.
		const result = await editImage(
			'item',
			loadFixture( 'exif-rotated-90cw.jpg' ),
			'image/jpeg',
			[
				{
					type: 'crop',
					args: { left: 0, top: 0, width: 100, height: 50 },
				},
			]
		);

		expect( result.width ).toBe( 32 );
		expect( result.height ).toBe( 32 );

		const image = decode( result );
		// libvips writes an upright (1) tag back into the saved JPEG.
		expect(
			image.getTypeof( 'orientation' ) === 0
				? 1
				: image.getInt( 'orientation' )
		).toBe( 1 );
		expect( isRed( image.getpoint( 16, 16 ) ) ).toBe( true );
		image.delete();
	} );

	it( 'keeps an UltraHDR gain map, transformed in step with the base image', async () => {
		const source = vips.Image.newFromBuffer(
			loadFixture( 'ultrahdr.jpg' )
		);
		expect( source.width ).toBe( 1024 );
		expect( source.height ).toBe( 768 );
		expect( source.gainmap ).toBeTruthy();
		const gainmapScale = source.width / source.gainmap!.width;
		source.delete();

		const result = await editImage(
			'item',
			loadFixture( 'ultrahdr.jpg' ),
			'image/jpeg',
			[
				{ type: 'rotate', args: { angle: 90 } },
				{
					type: 'crop',
					args: { left: 0, top: 0, width: 100, height: 50 },
				},
			]
		);

		expect( result.width ).toBe( 768 );
		expect( result.height ).toBe( 512 );

		const image = decode( result );
		expect( image.gainmap ).toBeTruthy();
		expect( image.gainmap!.width ).toBe( 768 / gainmapScale );
		expect( image.gainmap!.height ).toBe( 512 / gainmapScale );
		image.delete();
	} );
} );
