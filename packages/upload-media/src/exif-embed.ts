import { extractExifPayload } from './heic-parser';

/* eslint-disable no-bitwise */

/**
 * Extract the EXIF block from an ISOBMFF (HEIC/HEIF/AVIF) file in a form
 * ready to embed into a JPEG APP1 segment.
 *
 * The returned TIFF block has its Orientation tag reset to 1: the canvas
 * conversion decodes to upright pixels, so keeping the original value would
 * rotate the image a second time on display.
 *
 * @param buffer Raw ISOBMFF file contents.
 * @return TIFF block, or null when the file has no usable EXIF data.
 */
export function extractExifForJpeg( buffer: ArrayBuffer ): Uint8Array | null {
	const payload = extractExifPayload( buffer );
	if ( ! payload || payload.length < 8 ) {
		return null;
	}

	// The item body is a 4-byte exif_tiff_header_offset followed by a TIFF
	// block, though some encoders omit the prefix and start with the TIFF
	// byte-order marker ('II'/'MM') directly.
	const view = new DataView(
		payload.buffer,
		payload.byteOffset,
		payload.byteLength
	);
	let start = 0;
	const firstWord = view.getUint16( 0 );
	if ( firstWord !== 0x4949 && firstWord !== 0x4d4d ) {
		start = view.getUint32( 0 ) + 4;
	}
	if ( start + 8 > payload.length ) {
		return null;
	}

	const tiff = payload.slice( start );
	if ( ! resetTiffOrientation( tiff ) ) {
		return null;
	}
	return tiff;
}

/**
 * Reset the Orientation tag (0x0112) in a TIFF block to 1, in place.
 *
 * @param tiff TIFF block starting with the byte-order marker.
 * @return False when the block is not a parseable TIFF structure.
 */
function resetTiffOrientation( tiff: Uint8Array ): boolean {
	const view = new DataView( tiff.buffer, tiff.byteOffset, tiff.byteLength );

	const byteOrder = view.getUint16( 0 );
	let little: boolean;
	if ( byteOrder === 0x4949 ) {
		little = true;
	} else if ( byteOrder === 0x4d4d ) {
		little = false;
	} else {
		return false;
	}

	// IFD0 offset is relative to the TIFF header.
	const ifd0 = view.getUint32( 4, little );
	if ( ifd0 + 2 > tiff.length ) {
		return false;
	}

	const entryCount = view.getUint16( ifd0, little );
	for ( let i = 0; i < entryCount; i++ ) {
		const entry = ifd0 + 2 + i * 12;
		if ( entry + 12 > tiff.length ) {
			break;
		}
		// Orientation is a SHORT whose value sits in the first two bytes of
		// the 4-byte value/offset field.
		if ( view.getUint16( entry, little ) === 0x0112 ) {
			view.setUint16( entry + 8, 1, little );
			break;
		}
	}
	return true;
}

/**
 * Insert a TIFF block into a JPEG as an EXIF APP1 segment.
 *
 * The segment is placed immediately after the SOI marker, where the EXIF
 * specification and parsers (including PHP's `exif_read_data()`) expect it.
 *
 * @param jpeg JPEG file bytes.
 * @param tiff TIFF block to embed.
 * @return New JPEG bytes, or null when the input is not a JPEG or the block
 *         exceeds the 64 KiB APP1 segment limit.
 */
export function embedExifInJpeg(
	jpeg: Uint8Array,
	tiff: Uint8Array
): Uint8Array< ArrayBuffer > | null {
	if ( jpeg.length < 2 || jpeg[ 0 ] !== 0xff || jpeg[ 1 ] !== 0xd8 ) {
		return null;
	}

	// The segment length counts itself (2) plus the 'Exif\0\0' identifier (6).
	const segmentLength = 2 + 6 + tiff.length;
	if ( segmentLength > 0xffff ) {
		return null;
	}

	const out = new Uint8Array( jpeg.length + 2 + segmentLength );
	// SOI, then the APP1 marker and segment.
	out[ 0 ] = 0xff;
	out[ 1 ] = 0xd8;
	out[ 2 ] = 0xff;
	out[ 3 ] = 0xe1;
	out[ 4 ] = segmentLength >> 8;
	out[ 5 ] = segmentLength & 0xff;
	out.set( [ 0x45, 0x78, 0x69, 0x66, 0, 0 ], 6 ); // 'Exif\0\0'
	out.set( tiff, 12 );
	// The rest of the original JPEG.
	out.set( jpeg.subarray( 2 ), 12 + tiff.length );
	return out;
}

/* eslint-enable no-bitwise */
