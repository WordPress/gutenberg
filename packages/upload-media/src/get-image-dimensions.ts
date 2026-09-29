/**
 * Image dimensions and encoding details parsed from a file header.
 */
export interface ImageDimensions {
	/**
	 * Image width in pixels.
	 */
	width: number;
	/**
	 * Image height in pixels.
	 */
	height: number;
	/**
	 * Whether the image is interlaced (progressive JPEG or Adam7 PNG).
	 *
	 * Interlaced images cannot be decoded with shrink-on-load, so the full
	 * image must be buffered in memory at once. This matters for deciding
	 * whether an image is safe to process client-side within the wasm-vips
	 * memory cap.
	 */
	interlaced: boolean;
}

/**
 * Maximum number of bytes to read from the start of a file when probing for
 * dimensions. Generous enough to skip past large EXIF/ICC segments that can
 * precede a JPEG's frame header, while avoiding reading huge files in full.
 */
const MAX_HEADER_BYTES = 512 * 1024;

/**
 * Parses dimensions and interlacing from a JPEG file header.
 *
 * Walks the JPEG marker segments until the Start Of Frame (SOFn) marker, which
 * carries the image dimensions. Progressive DCT frames (SOF2/6/10/14) are
 * reported as interlaced.
 *
 * @param view DataView over the file header bytes.
 * @return Parsed dimensions, or null if they could not be determined.
 */
function parseJpeg( view: DataView ): ImageDimensions | null {
	let offset = 2; // Skip the SOI marker (0xFFD8).

	while ( offset < view.byteLength ) {
		// Markers begin with 0xFF; bail if we have lost alignment.
		if ( view.getUint8( offset ) !== 0xff ) {
			return null;
		}

		// Skip any 0xFF padding bytes preceding the marker code.
		while ( offset < view.byteLength && view.getUint8( offset ) === 0xff ) {
			offset++;
		}

		if ( offset >= view.byteLength ) {
			return null;
		}

		const marker = view.getUint8( offset );
		offset++;

		// Standalone markers without a length payload: TEM, RSTn, SOI, EOI.
		if ( marker === 0x01 || ( marker >= 0xd0 && marker <= 0xd9 ) ) {
			continue;
		}

		// Start Of Scan: pixel data begins, so no frame header was found.
		if ( marker === 0xda ) {
			return null;
		}

		if ( offset + 2 > view.byteLength ) {
			return null;
		}

		const segmentLength = view.getUint16( offset );
		if ( segmentLength < 2 ) {
			return null;
		}

		// Start Of Frame markers (0xC0-0xCF) carry the dimensions, except
		// DHT (0xC4), JPG extension (0xC8), and DAC/arithmetic (0xCC).
		const isStartOfFrame =
			marker >= 0xc0 &&
			marker <= 0xcf &&
			marker !== 0xc4 &&
			marker !== 0xc8 &&
			marker !== 0xcc;

		if ( isStartOfFrame ) {
			if ( offset + 7 > view.byteLength ) {
				return null;
			}
			// Segment layout: length(2) precision(1) height(2) width(2).
			const height = view.getUint16( offset + 3 );
			const width = view.getUint16( offset + 5 );
			// Progressive DCT frames: SOF2, SOF6, SOF10, SOF14.
			const interlaced =
				marker === 0xc2 ||
				marker === 0xc6 ||
				marker === 0xca ||
				marker === 0xce;
			return { width, height, interlaced };
		}

		offset += segmentLength;
	}

	return null;
}

/**
 * Parses dimensions and interlacing from a PNG file header.
 *
 * Reads the IHDR chunk, which is always the first chunk and contains the
 * dimensions and the interlace method (0 = none, 1 = Adam7).
 *
 * @param view DataView over the file header bytes.
 * @return Parsed dimensions, or null if they could not be determined.
 */
function parsePng( view: DataView ): ImageDimensions | null {
	// Signature (8 bytes) + IHDR length (4) + "IHDR" (4) + 13 bytes of data.
	if ( view.byteLength < 29 ) {
		return null;
	}

	// The IHDR chunk type must immediately follow the 8-byte signature and
	// 4-byte chunk length.
	const isIhdr =
		view.getUint8( 12 ) === 0x49 && // I
		view.getUint8( 13 ) === 0x48 && // H
		view.getUint8( 14 ) === 0x44 && // D
		view.getUint8( 15 ) === 0x52; // R

	if ( ! isIhdr ) {
		return null;
	}

	const width = view.getUint32( 16 );
	const height = view.getUint32( 20 );
	const interlaceMethod = view.getUint8( 28 );

	return { width, height, interlaced: interlaceMethod !== 0 };
}

/**
 * Reads an image's dimensions and interlacing from its header bytes.
 *
 * Only the leading bytes of the file are read, so this is cheap even for very
 * large images and never fully decodes the pixel data. Currently supports JPEG
 * and PNG, the formats most commonly affected by client-side memory limits;
 * other formats return null (treated as unknown).
 *
 * @param file The image file to inspect.
 * @return The parsed dimensions, or null if they could not be determined.
 */
export async function getImageDimensions(
	file: File
): Promise< ImageDimensions | null > {
	try {
		const headerBytes = Math.min( file.size, MAX_HEADER_BYTES );
		const buffer = await file.slice( 0, headerBytes ).arrayBuffer();
		const view = new DataView( buffer );

		// JPEG: starts with the SOI marker 0xFFD8.
		if ( view.byteLength >= 3 && view.getUint16( 0 ) === 0xffd8 ) {
			return parseJpeg( view );
		}

		// PNG: 8-byte signature 89 50 4E 47 0D 0A 1A 0A.
		if (
			view.byteLength >= 8 &&
			view.getUint32( 0 ) === 0x89504e47 &&
			view.getUint32( 4 ) === 0x0d0a1a0a
		) {
			return parsePng( view );
		}

		return null;
	} catch {
		return null;
	}
}
