#!/usr/bin/env node

/**
 * Generate test media assets for client-side media processing E2E tests.
 *
 * Uses raw binary construction to create valid image files without external dependencies.
 * Run: node bin/generate-test-media-assets.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const ASSETS_DIR = join( __dirname, '..', 'test', 'e2e', 'assets' );

mkdirSync( ASSETS_DIR, { recursive: true } );

/**
 * Creates a minimal valid PNG file.
 *
 * @param {number}  width       Image width.
 * @param {number}  height      Image height.
 * @param {boolean} transparent Whether to include an alpha channel.
 * @return {Buffer} PNG file buffer.
 */
function createPNG( width, height, transparent = false ) {
	const channels = transparent ? 4 : 3;
	const colorType = transparent ? 6 : 2;

	// Build raw image data (filter byte + pixel data per row).
	const rawData = [];
	for ( let y = 0; y < height; y++ ) {
		rawData.push( 0 ); // Filter: None.
		for ( let x = 0; x < width; x++ ) {
			rawData.push( ( x * 37 + y * 59 ) % 256 ); // R
			rawData.push( ( x * 53 + y * 41 ) % 256 ); // G
			rawData.push( ( x * 71 + y * 23 ) % 256 ); // B
			if ( transparent ) {
				// Checkerboard transparency.
				rawData.push(
					( Math.floor( x / 20 ) + Math.floor( y / 20 ) ) % 2 === 0
						? 128
						: 255
				);
			}
		}
	}

	const compressed = deflateSync( Buffer.from( rawData ) );

	const chunks = [];

	// IHDR chunk.
	const ihdr = Buffer.alloc( 13 );
	ihdr.writeUInt32BE( width, 0 );
	ihdr.writeUInt32BE( height, 4 );
	ihdr[ 8 ] = 8; // Bit depth.
	ihdr[ 9 ] = colorType;
	ihdr[ 10 ] = 0; // Compression.
	ihdr[ 11 ] = 0; // Filter.
	ihdr[ 12 ] = 0; // Interlace.
	chunks.push( makeChunk( 'IHDR', ihdr ) );

	// IDAT chunk.
	chunks.push( makeChunk( 'IDAT', compressed ) );

	// IEND chunk.
	chunks.push( makeChunk( 'IEND', Buffer.alloc( 0 ) ) );

	// PNG signature.
	const signature = Buffer.from( [
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	] );

	return Buffer.concat( [ signature, ...chunks ] );
}

/**
 * Creates a PNG chunk with CRC.
 *
 * @param {string} type Chunk type (4 chars).
 * @param {Buffer} data Chunk data.
 * @return {Buffer} Complete chunk.
 */
function makeChunk( type, data ) {
	const length = Buffer.alloc( 4 );
	length.writeUInt32BE( data.length, 0 );
	const typeBuffer = Buffer.from( type, 'ascii' );
	const crcData = Buffer.concat( [ typeBuffer, data ] );
	const crc = crc32( crcData );
	const crcBuffer = Buffer.alloc( 4 );
	crcBuffer.writeUInt32BE( crc >>> 0, 0 );
	return Buffer.concat( [ length, typeBuffer, data, crcBuffer ] );
}

/**
 * CRC32 implementation for PNG chunks.
 *
 * @param {Buffer} buf Input data.
 * @return {number} CRC32 value.
 */
function crc32( buf ) {
	let crc = 0xffffffff;
	for ( let i = 0; i < buf.length; i++ ) {
		crc ^= buf[ i ];
		for ( let j = 0; j < 8; j++ ) {
			crc = crc & 1 ? ( crc >>> 1 ) ^ 0xedb88320 : crc >>> 1;
		}
	}
	return ( crc ^ 0xffffffff ) >>> 0;
}

/**
 * Creates a minimal valid JPEG file.
 *
 * @param {number}      width  Image width.
 * @param {number}      height Image height.
 * @param {Buffer|null} exif   Optional EXIF data.
 * @return {Buffer} JPEG file buffer.
 */
function createJPEG( width, height, exif = null ) {
	const parts = [];

	// SOI.
	parts.push( Buffer.from( [ 0xff, 0xd8 ] ) );

	// JFIF APP0.
	const jfif = Buffer.from( [
		0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02,
		0x00, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
	] );
	parts.push( jfif );

	// Optional EXIF APP1.
	if ( exif ) {
		parts.push( exif );
	}

	// DQT (quantization table).
	const qt = Buffer.alloc( 69 );
	qt[ 0 ] = 0xff;
	qt[ 1 ] = 0xdb;
	qt.writeUInt16BE( 67, 2 ); // Length.
	qt[ 4 ] = 0; // Table 0, 8-bit.
	for ( let i = 0; i < 64; i++ ) {
		qt[ 5 + i ] = 1; // All quantization values = 1 (max quality).
	}
	parts.push( qt );

	// SOF0 (start of frame, baseline).
	const sof = Buffer.alloc( 19 );
	sof[ 0 ] = 0xff;
	sof[ 1 ] = 0xc0;
	sof.writeUInt16BE( 17, 2 ); // Length.
	sof[ 4 ] = 8; // Precision.
	sof.writeUInt16BE( height, 5 );
	sof.writeUInt16BE( width, 7 );
	sof[ 9 ] = 3; // Num components (YCbCr).
	// Y component.
	sof[ 10 ] = 1;
	sof[ 11 ] = 0x11;
	sof[ 12 ] = 0; // Qt 0.
	// Cb component.
	sof[ 13 ] = 2;
	sof[ 14 ] = 0x11;
	sof[ 15 ] = 0;
	// Cr component.
	sof[ 16 ] = 3;
	sof[ 17 ] = 0x11;
	sof[ 18 ] = 0;
	parts.push( sof );

	// DHT (Huffman tables) - minimal DC and AC tables.
	parts.push( createMinimalHuffmanTables() );

	// SOS (start of scan).
	const sos = Buffer.alloc( 14 );
	sos[ 0 ] = 0xff;
	sos[ 1 ] = 0xda;
	sos.writeUInt16BE( 12, 2 ); // Length.
	sos[ 4 ] = 3; // Num components.
	sos[ 5 ] = 1;
	sos[ 6 ] = 0x00; // Y: DC=0, AC=0.
	sos[ 7 ] = 2;
	sos[ 8 ] = 0x00; // Cb: DC=0, AC=0.
	sos[ 9 ] = 3;
	sos[ 10 ] = 0x00; // Cr: DC=0, AC=0.
	sos[ 11 ] = 0; // Ss.
	sos[ 12 ] = 63; // Se.
	sos[ 13 ] = 0x00; // Ah/Al.
	parts.push( sos );

	// Minimal scan data - encode MCUs.
	const mcuW = Math.ceil( width / 8 );
	const mcuH = Math.ceil( height / 8 );
	const totalMCUs = mcuW * mcuH;

	// Each MCU: 3 components (Y, Cb, Cr), each block is a DC value of 0 + EOB.
	// With our Huffman table: DC size=0 is code 0b00 (2 bits), EOB (AC 0x00) is code 0b00 (2 bits).
	// Per component: 4 bits, per MCU: 12 bits.
	const totalBits = totalMCUs * 12;
	const totalBytes = Math.ceil( totalBits / 8 );
	const scanData = Buffer.alloc( totalBytes, 0x00 );
	// All zeros = all DC size=0 codes and all EOB codes with our tables.

	// Byte-stuff and add to parts (replace 0xFF with 0xFF 0x00).
	const stuffed = [];
	for ( let i = 0; i < scanData.length; i++ ) {
		stuffed.push( scanData[ i ] );
		if ( scanData[ i ] === 0xff ) {
			stuffed.push( 0x00 );
		}
	}
	parts.push( Buffer.from( stuffed ) );

	// EOI.
	parts.push( Buffer.from( [ 0xff, 0xd9 ] ) );

	return Buffer.concat( parts );
}

/**
 * Creates minimal Huffman tables for JPEG encoding.
 *
 * @return {Buffer} DHT marker segment.
 */
function createMinimalHuffmanTables() {
	// DC table (class=0, id=0): one symbol, size 0 (meaning DC diff=0).
	// Code: 0b00 (2-bit code, but we pad to make it the simplest).
	const dcBits = Buffer.alloc( 16, 0 );
	dcBits[ 0 ] = 1; // 1 code of length 1.
	const dcSymbols = Buffer.from( [ 0x00 ] ); // Symbol: size=0.

	// AC table (class=1, id=0): one symbol, EOB (0x00).
	const acBits = Buffer.alloc( 16, 0 );
	acBits[ 0 ] = 1; // 1 code of length 1.
	const acSymbols = Buffer.from( [ 0x00 ] ); // Symbol: EOB.

	const dcTable = Buffer.concat( [
		Buffer.from( [ 0x00 ] ), // Class 0 (DC), table 0.
		dcBits,
		dcSymbols,
	] );

	const acTable = Buffer.concat( [
		Buffer.from( [ 0x10 ] ), // Class 1 (AC), table 0.
		acBits,
		acSymbols,
	] );

	const payload = Buffer.concat( [ dcTable, acTable ] );
	const header = Buffer.alloc( 4 );
	header[ 0 ] = 0xff;
	header[ 1 ] = 0xc4;
	header.writeUInt16BE( payload.length + 2, 2 );

	return Buffer.concat( [ header, payload ] );
}

/**
 * Creates EXIF APP1 data with orientation tag.
 *
 * @param {number} orientation EXIF orientation value (1-8).
 * @return {Buffer} APP1 marker segment.
 */
function createExifOrientation( orientation ) {
	// Construct minimal EXIF with Orientation tag.
	const exifHeader = Buffer.from( 'Exif\x00\x00', 'binary' );

	// TIFF header (little-endian).
	const tiff = Buffer.alloc( 8 );
	tiff[ 0 ] = 0x49;
	tiff[ 1 ] = 0x49; // Little-endian ('II').
	tiff.writeUInt16LE( 42, 2 ); // Magic.
	tiff.writeUInt32LE( 8, 4 ); // Offset to IFD0.

	// IFD0: 1 entry (Orientation).
	const ifdCount = Buffer.alloc( 2 );
	ifdCount.writeUInt16LE( 1, 0 );

	// Orientation tag entry.
	const orientEntry = Buffer.alloc( 12 );
	orientEntry.writeUInt16LE( 0x0112, 0 ); // Tag: Orientation.
	orientEntry.writeUInt16LE( 3, 2 ); // Type: SHORT.
	orientEntry.writeUInt32LE( 1, 4 ); // Count.
	orientEntry.writeUInt16LE( orientation, 8 ); // Value.

	// Next IFD offset (0 = no more IFDs).
	const nextIFD = Buffer.alloc( 4, 0 );

	const exifBody = Buffer.concat( [
		tiff,
		ifdCount,
		orientEntry,
		nextIFD,
	] );

	const payload = Buffer.concat( [ exifHeader, exifBody ] );

	// APP1 marker.
	const marker = Buffer.alloc( 4 );
	marker[ 0 ] = 0xff;
	marker[ 1 ] = 0xe1;
	marker.writeUInt16BE( payload.length + 2, 2 );

	return Buffer.concat( [ marker, payload ] );
}

/**
 * Creates a minimal valid WebP file (VP8 lossy).
 *
 * @param {number} width  Image width.
 * @param {number} height Image height.
 * @return {Buffer} WebP file buffer.
 */
function createWebP( width, height ) {
	// VP8 bitstream header for a minimal image.
	// VP8 frame tag (3 bytes): keyframe, version=0, show_frame=1.
	const frameTag = Buffer.from( [ 0x9d, 0x01, 0x2a ] );

	// Width and height (little-endian 16-bit, with scale=0).
	const dims = Buffer.alloc( 4 );
	dims.writeUInt16LE( width & 0x3fff, 0 );
	dims.writeUInt16LE( height & 0x3fff, 2 );

	// Minimal VP8 data: partition sizes and empty coefficients.
	// First partition with minimal bool decoder data.
	const partData = Buffer.alloc( 32, 0 );
	// Set some bits for a valid (but minimal) VP8 frame.
	partData[ 0 ] = 0x01; // Color space + clamping.
	partData[ 1 ] = 0x00;

	const vp8Data = Buffer.concat( [ frameTag, dims, partData ] );

	// VP8 chunk.
	const vp8ChunkSize = vp8Data.length;
	const vp8Header = Buffer.from( 'VP8 ' );
	const vp8SizeBuf = Buffer.alloc( 4 );
	vp8SizeBuf.writeUInt32LE( vp8ChunkSize, 0 );

	const riffPayload = Buffer.concat( [
		Buffer.from( 'WEBP' ),
		vp8Header,
		vp8SizeBuf,
		vp8Data,
	] );

	// Pad to even length.
	const padded =
		riffPayload.length % 2 === 0
			? riffPayload
			: Buffer.concat( [ riffPayload, Buffer.alloc( 1, 0 ) ] );

	const riffHeader = Buffer.from( 'RIFF' );
	const riffSize = Buffer.alloc( 4 );
	riffSize.writeUInt32LE( padded.length, 0 );

	return Buffer.concat( [ riffHeader, riffSize, padded ] );
}

/**
 * Creates a minimal valid GIF89a with 2 frames.
 *
 * @param {number} width  Image width.
 * @param {number} height Image height.
 * @return {Buffer} GIF file buffer.
 */
function createAnimatedGIF( width, height ) {
	const parts = [];

	// Header.
	parts.push( Buffer.from( 'GIF89a' ) );

	// Logical screen descriptor.
	const lsd = Buffer.alloc( 7 );
	lsd.writeUInt16LE( width, 0 );
	lsd.writeUInt16LE( height, 2 );
	lsd[ 4 ] = 0x80; // GCT flag, 2 colors.
	lsd[ 5 ] = 0; // Background color.
	lsd[ 6 ] = 0; // Pixel aspect ratio.
	parts.push( lsd );

	// Global color table (2 entries = 6 bytes).
	parts.push(
		Buffer.from( [
			0xff, 0x00, 0x00, // Red.
			0x00, 0x00, 0xff, // Blue.
		] )
	);

	// Application extension for animation (NETSCAPE2.0).
	parts.push(
		Buffer.from( [
			0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50,
			0x45, 0x32, 0x2e, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00,
		] )
	);

	// Two frames.
	for ( let frame = 0; frame < 2; frame++ ) {
		// Graphic control extension.
		parts.push(
			Buffer.from( [
				0x21,
				0xf9,
				0x04,
				0x04, // Disposal: restore to bg.
				0x0a,
				0x00, // Delay: 10/100 sec.
				0x00, // Transparent color index.
				0x00,
			] )
		);

		// Image descriptor.
		const imgDesc = Buffer.alloc( 10 );
		imgDesc[ 0 ] = 0x2c; // Image separator.
		imgDesc.writeUInt16LE( 0, 1 ); // Left.
		imgDesc.writeUInt16LE( 0, 3 ); // Top.
		imgDesc.writeUInt16LE( width, 5 );
		imgDesc.writeUInt16LE( height, 7 );
		imgDesc[ 9 ] = 0; // No local color table.
		parts.push( imgDesc );

		// LZW minimum code size.
		parts.push( Buffer.from( [ 0x02 ] ) );

		// LZW data: clear code + all pixels as color index (frame 0=0, frame 1=1) + EOI.
		// Minimal LZW encoded data for uniform color.
		const clearCode = 4; // 2^2.
		const eoiCode = 5;
		const colorIndex = frame;

		// Pack bits: clear(3 bits) + color(3 bits) + eoi(3 bits) = 9 bits minimum.
		// Actually need to fit the pixel count of width*height pixels.
		const pixels = width * height;
		/** @type {Array<number>} */
		const bits = [];

		// Push clear code (3 bits for min code size 2).
		pushBits( bits, clearCode, 3 );

		// Push all pixels.
		for ( let i = 0; i < pixels; i++ ) {
			pushBits( bits, colorIndex, 3 );
		}

		// Push EOI.
		pushBits( bits, eoiCode, 3 );

		// Convert bits to bytes.
		const byteArr = bitsToBytes( bits );

		// Write sub-blocks.
		let offset = 0;
		while ( offset < byteArr.length ) {
			const blockSize = Math.min( 255, byteArr.length - offset );
			parts.push( Buffer.from( [ blockSize ] ) );
			parts.push( Buffer.from( byteArr.slice( offset, offset + blockSize ) ) );
			offset += blockSize;
		}

		// Block terminator.
		parts.push( Buffer.from( [ 0x00 ] ) );
	}

	// Trailer.
	parts.push( Buffer.from( [ 0x3b ] ) );

	return Buffer.concat( parts );
}

/**
 * Pushes individual bits of a value into a bit array (LSB first).
 *
 * @param {Array<number>} bits  Target bit array.
 * @param {number}        value Value to decompose.
 * @param {number}        count Number of bits to push.
 */
function pushBits( bits, value, count ) {
	for ( let i = 0; i < count; i++ ) {
		bits.push( ( value >> i ) & 1 );
	}
}

/**
 * Converts a bit array to a byte array.
 *
 * @param {Array<number>} bits Source bit array.
 * @return {Array<number>} Byte array.
 */
function bitsToBytes( bits ) {
	const bytes = [];
	for ( let i = 0; i < bits.length; i += 8 ) {
		let byte = 0;
		for ( let j = 0; j < 8 && i + j < bits.length; j++ ) {
			byte |= bits[ i + j ] << j;
		}
		bytes.push( byte );
	}
	return bytes;
}

/**
 * Creates a minimal valid AVIF file.
 *
 * @param {number} width  Image width.
 * @param {number} height Image height.
 * @return {Buffer} AVIF file buffer.
 */
function createAVIF( width, height ) {
	// AVIF is HEIF container with AV1 codec. Create minimal valid container.
	const boxes = [];

	// ftyp box.
	const ftyp = createBox(
		'ftyp',
		Buffer.concat( [
			Buffer.from( 'avif' ), // Major brand.
			Buffer.alloc( 4, 0 ), // Minor version.
			Buffer.from( 'avifmif1' ), // Compatible brands.
		] )
	);
	boxes.push( ftyp );

	// meta box (fullbox with version/flags).
	const hdlr = createBox(
		'hdlr',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.alloc( 4, 0 ), // Pre-defined.
			Buffer.from( 'pict' ), // Handler type.
			Buffer.alloc( 12, 0 ), // Reserved.
			Buffer.from( '\0' ), // Name (null terminated).
		] )
	);

	// pitm (primary item).
	const pitm = createBox(
		'pitm',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.from( [ 0x00, 0x01 ] ), // Item ID = 1.
		] )
	);

	// iloc box.
	const iloc = createBox(
		'iloc',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.from( [ 0x44 ] ), // Offset size = 4, length size = 4.
			Buffer.from( [ 0x00 ] ), // Base offset size = 0, index size = 0.
			Buffer.from( [ 0x00, 0x01 ] ), // Item count = 1.
			Buffer.from( [ 0x00, 0x01 ] ), // Item ID = 1.
			Buffer.from( [ 0x00, 0x00 ] ), // Data ref index.
			Buffer.from( [ 0x00, 0x01 ] ), // Extent count = 1.
			Buffer.alloc( 4, 0 ), // Extent offset (will be 0).
			Buffer.from( [ 0x00, 0x00, 0x00, 0x01 ] ), // Extent length = 1.
		] )
	);

	// iinf box.
	const infe = createBox(
		'infe',
		Buffer.concat( [
			Buffer.from( [ 0x02, 0x00, 0x00, 0x00 ] ), // Version 2 + flags.
			Buffer.from( [ 0x00, 0x01 ] ), // Item ID = 1.
			Buffer.from( [ 0x00, 0x00 ] ), // Item protection index.
			Buffer.from( 'av01' ), // Item type.
			Buffer.from( 'Color\0' ), // Item name.
		] )
	);

	const iinf = createBox(
		'iinf',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.from( [ 0x00, 0x01 ] ), // Entry count = 1.
			infe,
		] )
	);

	// ispe property (image spatial extents).
	const ispe = createBox(
		'ispe',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.alloc( 4, 0 ), // Width.
			Buffer.alloc( 4, 0 ), // Height.
		] )
	);
	// Write width/height.
	ispe.writeUInt32BE( width, 12 );
	ispe.writeUInt32BE( height, 16 );

	// iprp + ipco + ipma.
	const ipco = createBox( 'ipco', ispe );
	const ipma = createBox(
		'ipma',
		Buffer.concat( [
			Buffer.alloc( 4, 0 ), // Version + flags.
			Buffer.from( [ 0x00, 0x00, 0x00, 0x01 ] ), // Entry count = 1.
			Buffer.from( [ 0x00, 0x01 ] ), // Item ID = 1.
			Buffer.from( [ 0x01 ] ), // Association count = 1.
			Buffer.from( [ 0x01 ] ), // essential=0, property_index=1.
		] )
	);
	const iprp = createBox( 'iprp', Buffer.concat( [ ipco, ipma ] ) );

	const metaContent = Buffer.concat( [
		Buffer.alloc( 4, 0 ), // Version + flags (meta is a full box).
		hdlr,
		pitm,
		iloc,
		iinf,
		iprp,
	] );
	const meta = createBox( 'meta', metaContent );
	boxes.push( meta );

	// mdat box (minimal AV1 data).
	const mdat = createBox( 'mdat', Buffer.from( [ 0x00 ] ) );
	boxes.push( mdat );

	return Buffer.concat( boxes );
}

/**
 * Creates an ISO BMFF box.
 *
 * @param {string} type Box type (4 chars).
 * @param {Buffer} data Box data.
 * @return {Buffer} Complete box.
 */
function createBox( type, data ) {
	const size = Buffer.alloc( 4 );
	size.writeUInt32BE( 8 + data.length, 0 );
	return Buffer.concat( [ size, Buffer.from( type, 'ascii' ), data ] );
}

// Generate all test assets.
console.log( 'Generating test media assets...' );

// 1. Transparent PNG.
const transparentPng = createPNG( 200, 150, true );
writeFileSync(
	join( ASSETS_DIR, '200x150_e2e_test_image_transparent.png' ),
	transparentPng
);
console.log( '  Created 200x150_e2e_test_image_transparent.png' );

// 2. Opaque PNG.
const opaquePng = createPNG( 200, 150, false );
writeFileSync(
	join( ASSETS_DIR, '200x150_e2e_test_image_opaque.png' ),
	opaquePng
);
console.log( '  Created 200x150_e2e_test_image_opaque.png' );

// 3. WebP.
const webp = createWebP( 200, 150 );
writeFileSync( join( ASSETS_DIR, '200x150_e2e_test_image.webp' ), webp );
console.log( '  Created 200x150_e2e_test_image.webp' );

// 4. Animated GIF.
const gif = createAnimatedGIF( 100, 80 );
writeFileSync( join( ASSETS_DIR, '100x80_e2e_test_image_animated.gif' ), gif );
console.log( '  Created 100x80_e2e_test_image_animated.gif' );

// 5. AVIF.
const avif = createAVIF( 200, 150 );
writeFileSync( join( ASSETS_DIR, '200x150_e2e_test_image.avif' ), avif );
console.log( '  Created 200x150_e2e_test_image.avif' );

// 6. JPEG with EXIF orientation=6 (90 CW rotation).
const exifOrientation = createExifOrientation( 6 );
const rotatedJpeg = createJPEG( 1024, 768, exifOrientation );
writeFileSync(
	join( ASSETS_DIR, '1024x768_e2e_test_image_rotated.jpeg' ),
	rotatedJpeg
);
console.log( '  Created 1024x768_e2e_test_image_rotated.jpeg' );

// 7. Oversized JPEG (5000x4000).
const oversizedJpeg = createJPEG( 5000, 4000 );
writeFileSync(
	join( ASSETS_DIR, '5000x4000_e2e_test_image_oversized.jpeg' ),
	oversizedJpeg
);
console.log( '  Created 5000x4000_e2e_test_image_oversized.jpeg' );

console.log( 'Done! All test media assets generated.' );
