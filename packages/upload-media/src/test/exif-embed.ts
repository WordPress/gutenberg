import { readFileSync } from 'fs';
import { join } from 'path';
import { extractExifForJpeg, embedExifInJpeg } from '../exif-embed';

/* eslint-disable no-bitwise */

const loadFixture = ( file: string ): ArrayBuffer => {
	const contents = readFileSync( join( __dirname, 'fixtures', file ) );
	return contents.buffer.slice(
		contents.byteOffset,
		contents.byteOffset + contents.byteLength
	) as ArrayBuffer;
};

/**
 * Read the Orientation tag (0x0112) from a TIFF block.
 *
 * @param tiff TIFF block starting with the byte-order marker.
 * @return Orientation value, or null when the tag is absent.
 */
function readOrientation( tiff: Uint8Array ): number | null {
	const view = new DataView( tiff.buffer, tiff.byteOffset, tiff.byteLength );
	const little = view.getUint16( 0 ) === 0x4949;
	const ifd0 = view.getUint32( 4, little );
	const entryCount = view.getUint16( ifd0, little );
	for ( let i = 0; i < entryCount; i++ ) {
		const entry = ifd0 + 2 + i * 12;
		if ( view.getUint16( entry, little ) === 0x0112 ) {
			return view.getUint16( entry + 8, little );
		}
	}
	return null;
}

/**
 * Build a big-endian TIFF block with a single Orientation entry.
 *
 * @param orientation EXIF orientation value (1-8).
 */
function buildTiff( orientation: number ): Uint8Array {
	const tiff = new Uint8Array( 8 + 2 + 12 + 4 );
	const view = new DataView( tiff.buffer );
	tiff[ 0 ] = 0x4d;
	tiff[ 1 ] = 0x4d;
	view.setUint16( 2, 0x002a );
	view.setUint32( 4, 8 );
	view.setUint16( 8, 1 );
	view.setUint16( 10, 0x0112 );
	view.setUint16( 12, 3 );
	view.setUint32( 14, 1 );
	view.setUint16( 18, orientation );
	return tiff;
}

describe( 'extractExifForJpeg', () => {
	it( 'extracts the EXIF block from a HEIC file with the orientation reset', () => {
		// Fixture carries Orientation=6; the conversion bakes rotation into
		// the pixels, so the embedded copy must not rotate again.
		const tiff = extractExifForJpeg(
			loadFixture( 'exif-rotated-90cw.heic' )
		);

		expect( tiff ).not.toBeNull();
		// Starts with a TIFF byte-order marker, not the ISOBMFF offset prefix.
		const marker = ( tiff![ 0 ] << 8 ) | tiff![ 1 ];
		expect( [ 0x4949, 0x4d4d ] ).toContain( marker );
		expect( readOrientation( tiff! ) ).toBe( 1 );
	} );

	it( 'extracts EXIF from an AVIF container', () => {
		const tiff = extractExifForJpeg(
			loadFixture( 'exif-upside-down.avif' )
		);

		expect( tiff ).not.toBeNull();
		expect( readOrientation( tiff! ) ).toBe( 1 );
	} );

	it( 'returns null for a file without EXIF data', () => {
		const buffer = new TextEncoder().encode( 'not an image' ).buffer;
		expect( extractExifForJpeg( buffer as ArrayBuffer ) ).toBeNull();
	} );
} );

describe( 'embedExifInJpeg', () => {
	const minimalJpeg = new Uint8Array( [ 0xff, 0xd8, 0xff, 0xd9 ] );

	it( 'inserts an APP1 segment immediately after SOI', () => {
		const tiff = buildTiff( 1 );
		const result = embedExifInJpeg( minimalJpeg, tiff );

		expect( result ).not.toBeNull();
		expect( result! ).toHaveLength(
			minimalJpeg.length + 2 + 2 + 6 + tiff.length
		);
		// SOI is untouched.
		expect( result![ 0 ] ).toBe( 0xff );
		expect( result![ 1 ] ).toBe( 0xd8 );
		// APP1 marker.
		expect( result![ 2 ] ).toBe( 0xff );
		expect( result![ 3 ] ).toBe( 0xe1 );
		// Segment length counts itself plus the identifier and TIFF block.
		const length = ( result![ 4 ] << 8 ) | result![ 5 ];
		expect( length ).toBe( 2 + 6 + tiff.length );
		// 'Exif\0\0' identifier.
		expect( Array.from( result!.subarray( 6, 12 ) ) ).toEqual( [
			0x45, 0x78, 0x69, 0x66, 0, 0,
		] );
		// TIFF block follows, then the rest of the original JPEG.
		expect(
			Array.from( result!.subarray( 12, 12 + tiff.length ) )
		).toEqual( Array.from( tiff ) );
		expect( result![ result!.length - 2 ] ).toBe( 0xff );
		expect( result![ result!.length - 1 ] ).toBe( 0xd9 );
	} );

	it( 'returns null when the input is not a JPEG', () => {
		expect(
			embedExifInJpeg( new Uint8Array( [ 0x00, 0x01 ] ), buildTiff( 1 ) )
		).toBeNull();
	} );

	it( 'returns null when the block exceeds the APP1 segment limit', () => {
		expect(
			embedExifInJpeg( minimalJpeg, new Uint8Array( 0xffff ) )
		).toBeNull();
	} );
} );

/* eslint-enable no-bitwise */
