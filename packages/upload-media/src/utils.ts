import { getFilename } from '@wordpress/url';
import { _x } from '@wordpress/i18n';

/**
 * Converts a Blob to a File with a default name like "image.png".
 *
 * If it is already a File object, it is returned unchanged.
 *
 * Handles cross-realm File objects (e.g., from iframes) that have a `name`
 * property but fail `instanceof File` checks because the File constructor
 * differs between browsing contexts.
 *
 * @param fileOrBlob Blob object.
 * @return File object.
 */
export function convertBlobToFile( fileOrBlob: Blob | File ): File {
	if ( fileOrBlob instanceof File ) {
		return fileOrBlob;
	}

	// Handle cross-realm File objects (e.g., from iframes where the block
	// editor canvas renders). These objects have a `name` property but fail
	// the `instanceof File` check because each browsing context has its own
	// File constructor.
	if (
		'name' in fileOrBlob &&
		typeof ( fileOrBlob as File ).name === 'string'
	) {
		return new File( [ fileOrBlob ], ( fileOrBlob as File ).name, {
			type: fileOrBlob.type,
			lastModified: ( fileOrBlob as File ).lastModified,
		} );
	}

	// Extension is only an approximation.
	// The server will override it if incorrect.
	const ext = fileOrBlob.type.split( '/' )[ 1 ];
	const mediaType =
		'application/pdf' === fileOrBlob.type
			? 'document'
			: fileOrBlob.type.split( '/' )[ 0 ];
	return new File( [ fileOrBlob ], `${ mediaType }.${ ext }`, {
		type: fileOrBlob.type,
	} );
}

/**
 * Renames a given file and returns a new file.
 *
 * Copies over the last modified time.
 *
 * @param file File object.
 * @param name File name.
 * @return Renamed file object.
 */
export function renameFile( file: File, name: string ): File {
	return new File( [ file ], name, {
		type: file.type,
		lastModified: file.lastModified,
	} );
}

/**
 * Clones a given file object.
 *
 * @param file File object.
 * @return New file object.
 */
export function cloneFile( file: File ): File {
	return renameFile( file, file.name );
}

/**
 * Returns the file extension from a given file name or URL.
 *
 * @param file File URL.
 * @return File extension or null if it does not have one.
 */
export function getFileExtension( file: string ): string | null {
	return file.includes( '.' ) ? file.split( '.' ).pop() || null : null;
}

/**
 * Returns file basename without extension.
 *
 * For example, turns "my-awesome-file.jpeg" into "my-awesome-file".
 *
 * @param name File name.
 * @return File basename.
 */
export function getFileBasename( name: string ): string {
	return name.includes( '.' )
		? name.split( '.' ).slice( 0, -1 ).join( '.' )
		: name;
}

/**
 * Returns the file name including extension from a URL.
 *
 * @param url File URL.
 * @return File name.
 */
export function getFileNameFromUrl( url: string ) {
	return getFilename( url ) || _x( 'unnamed', 'file name' );
}

/**
 * Detects whether a file buffer contains an animated GIF.
 *
 * Performs binary analysis of the GIF file structure:
 * 1. Checks for the GIF magic bytes ("GIF8")
 * 2. Counts frame blocks by scanning for Graphic Control Extension headers
 *    (Block Terminator 0x00 + Extension Introducer 0x21 + Graphic Control Label 0xF9)
 * 3. Returns true if more than 1 frame is found
 *
 * This is a deliberately cheap heuristic, not a full GIF parser. It scans
 * the raw bytes for the Graphic Control Extension marker rather than walking
 * the block structure, which has two known limitations:
 *
 * - False positives: the 0x00 0x21 0xF9 byte sequence can occur coincidentally
 *   inside LZW-compressed image data, so a single-frame GIF may be reported as
 *   animated.
 * - False negatives: Graphic Control Extension blocks are optional per the GIF
 *   spec, so an animated GIF that omits them is reported as static.
 *
 * Both outcomes are non-destructive: the worker's ImageDecoder frame count is
 * the authoritative source, so a misdetected static GIF still encodes to an
 * accurate (1-frame) video, and a misdetected animated GIF simply falls back
 * to the normal image upload pipeline. A full structural parse is intentionally
 * avoided here to keep this off the hot path of every GIF upload.
 *
 * Based on the GIF specification:
 *
 * @see http://www.matthewflickinger.com/lab/whatsinagif/
 *
 * @param buffer File ArrayBuffer.
 * @return Whether the buffer contains an animated GIF.
 */
export function isAnimatedGif( buffer: ArrayBuffer ): boolean {
	const view = new Uint8Array( buffer );

	// Check GIF magic bytes: "GIF8" (0x47 0x49 0x46 0x38).
	if (
		view.length < 4 ||
		view[ 0 ] !== 0x47 ||
		view[ 1 ] !== 0x49 ||
		view[ 2 ] !== 0x46 ||
		view[ 3 ] !== 0x38
	) {
		return false;
	}

	// Count frames by looking for Graphic Control Extension headers.
	// Pattern: Block Terminator (0x00) + Extension Introducer (0x21) + Graphic Control Label (0xF9).
	let frameCount = 0;
	for ( let i = 0; i < view.length - 2; i++ ) {
		if (
			view[ i ] === 0x00 &&
			view[ i + 1 ] === 0x21 &&
			view[ i + 2 ] === 0xf9
		) {
			frameCount++;
			if ( frameCount > 1 ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Brands that identify a HEIC/HEIF image, as registered with the MP4RA.
 *
 * `mif1` and `msf1` are the generic HEIF brands, which AVIF files carry too,
 * so the AVIF brands are ruled out before these are consulted.
 */
const HEIC_BRANDS = [
	'heic',
	'heix',
	'heim',
	'heis',
	'hevc',
	'hevx',
	'hevm',
	'hevs',
	'mif1',
	'msf1',
];
const AVIF_BRANDS = [ 'avif', 'avis' ];

/**
 * Detects whether a file buffer contains a HEIC/HEIF image.
 *
 * Performs binary analysis of the ISOBMFF file structure:
 * 1. Checks for the File Type Box marker ("ftyp" at offset 4)
 * 2. Collects the brands it declares (major brand at offset 8, compatible
 *    brands from offset 16 on, each four ASCII characters)
 * 3. Returns true if a HEIC/HEIF brand is present and no AVIF brand is
 *
 * Used when the browser can't report a MIME type at all (`file.type === ''`),
 * which happens on platforms lacking the OS-level HEVC codec. More reliable
 * than the file name, which is only a naming convention.
 *
 * Only the File Type Box is read, so a file can declare a HEIF brand and still
 * be undecodable. That is non-destructive: it reaches the HEIC conversion path,
 * where `parseHeic()` does the full parse and a failure surfaces as a regular
 * decode error.
 *
 * Based on ISO/IEC 14496-12 (ISOBMFF) and ISO/IEC 23008-12 (HEIF):
 *
 * @see https://mp4ra.org/registered-types/brands
 * @see https://nokiatech.github.io/heif/technical.html
 *
 * @param buffer File ArrayBuffer. The first 64 bytes cover the File Type Box.
 * @return Whether the buffer contains a HEIC/HEIF image.
 */
export function isHeicBuffer( buffer: ArrayBuffer ): boolean {
	const view = new Uint8Array( buffer );

	// A File Type Box is at least: size (4) + "ftyp" (4) + major brand (4).
	if ( view.length < 12 ) {
		return false;
	}

	// Check the File Type Box marker: "ftyp" (0x66 0x74 0x79 0x70) at offset 4.
	if (
		view[ 4 ] !== 0x66 ||
		view[ 5 ] !== 0x74 ||
		view[ 6 ] !== 0x79 ||
		view[ 7 ] !== 0x70
	) {
		return false;
	}

	// Collect the brands: the major one at offset 8, then the compatible ones
	// every 4 bytes from 16 on, skipping the minor version at 12. The box size
	// bounds the scan, as anything past it belongs to the next box.
	const boxSize = new DataView(
		buffer,
		view.byteOffset,
		view.byteLength
	).getUint32( 0 );
	const end = Math.min( boxSize || view.length, view.length );
	const brands = [ String.fromCharCode( ...view.subarray( 8, 12 ) ) ];
	for ( let i = 16; i + 4 <= end; i += 4 ) {
		brands.push( String.fromCharCode( ...view.subarray( i, i + 4 ) ) );
	}

	if ( brands.some( ( brand ) => AVIF_BRANDS.includes( brand ) ) ) {
		return false;
	}

	return brands.some( ( brand ) => HEIC_BRANDS.includes( brand ) );
}
