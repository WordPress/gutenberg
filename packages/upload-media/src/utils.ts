import { getFilename } from '@wordpress/url';
import { _x } from '@wordpress/i18n';
import { HEIC_MIME_TYPES } from './store/constants';

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
 * Number of leading bytes that always contain a complete File Type Box.
 *
 * The box is a 4-byte size, the `ftyp` marker, a major brand, a minor version,
 * and then one 4-byte compatible brand each. 64 bytes leaves room for a dozen
 * compatible brands, well beyond what image files declare.
 */
export const FILE_TYPE_BOX_BYTES = 64;

/**
 * Brands that identify a HEIC/HEIF image, as registered with the MP4RA.
 *
 * `mif1` and `msf1` are the generic HEIF brands, which AVIF files carry as a
 * compatible brand too, so the AVIF brands have to be ruled out before these
 * are consulted.
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

/**
 * Brands that identify an AVIF image, which shares the HEIF container.
 */
const AVIF_BRANDS = [ 'avif', 'avis' ];

/**
 * Detects whether a file buffer contains a HEIC/HEIF image.
 *
 * Reads the ISOBMFF File Type Box, which every HEIF-family file opens with:
 *
 * 1. Checks for the `ftyp` marker at offset 4.
 * 2. Collects the brands the box declares — the major brand at offset 8, then
 *    the compatible brands from offset 16 on, four ASCII characters each.
 * 3. Returns true when a HEIC/HEIF brand is present and no AVIF brand is.
 *
 * The browser derives `File.type` from the file extension alone, so this is the
 * only way to recognize a HEIC photo that was saved as `.jpg` or `.png`, or one
 * the operating system could not identify at all (`File.type === ''`).
 *
 * Only the File Type Box is read, so a file can declare a HEIF brand here and
 * still turn out to be undecodable. That is harmless: it means the file reaches
 * the HEIC conversion path, where a real decode is attempted and any failure
 * surfaces as an ordinary decode error.
 *
 * Based on ISO/IEC 14496-12 (ISOBMFF) and ISO/IEC 23008-12 (HEIF):
 *
 * @see https://mp4ra.org/registered-types/brands
 *
 * @param buffer File ArrayBuffer. The first `FILE_TYPE_BOX_BYTES` bytes suffice.
 * @return Whether the buffer contains a HEIC/HEIF image.
 */
export function isHeicBuffer( buffer: ArrayBuffer ): boolean {
	const view = new Uint8Array( buffer );

	const readBrand = ( offset: number ) =>
		String.fromCharCode( ...view.subarray( offset, offset + 4 ) );

	// The File Type Box marker follows the 4-byte box size.
	if ( view.length < 12 || readBrand( 4 ) !== 'ftyp' ) {
		return false;
	}

	// The major brand, then every compatible brand after the minor version.
	const brands = [ readBrand( 8 ) ];
	for ( let offset = 16; offset + 4 <= view.length; offset += 4 ) {
		brands.push( readBrand( offset ) );
	}

	if ( brands.some( ( brand ) => AVIF_BRANDS.includes( brand ) ) ) {
		return false;
	}

	return brands.some( ( brand ) => HEIC_BRANDS.includes( brand ) );
}

/**
 * Detects whether a file is a HEIC/HEIF image, whatever its name claims.
 *
 * A browser derives `File.type` from the file extension alone, so a HEIC photo
 * saved as `.jpg` or `.png` announces itself as a JPEG or PNG, and one the
 * operating system cannot identify announces nothing at all. Both are settled
 * here by reading the file's own header.
 *
 * Only files that could plausibly be images are read, so an ISOBMFF video is
 * never mistaken for a still and no non-image upload pays for the read.
 *
 * @param file File to inspect.
 * @return Whether the file is a HEIC/HEIF image.
 */
export async function isHeicFile( file: File ): Promise< boolean > {
	if ( HEIC_MIME_TYPES.includes( file.type ) ) {
		return true;
	}

	if ( file.type && ! file.type.startsWith( 'image/' ) ) {
		return false;
	}

	try {
		return isHeicBuffer(
			await file.slice( 0, FILE_TYPE_BOX_BYTES ).arrayBuffer()
		);
	} catch {
		// An unreadable file is left to the upload itself to report.
		return false;
	}
}
