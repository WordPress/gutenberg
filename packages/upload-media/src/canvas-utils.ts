/**
 * Internal dependencies
 */
import { getFileBasename } from './utils';

/**
 * Converts an image file to JPEG using the browser's native decoder and canvas.
 *
 * Uses createImageBitmap() for decoding (leverages OS/browser-licensed HEVC codecs)
 * and OffscreenCanvas for JPEG conversion. This avoids shipping our own HEVC decoder,
 * sidestepping patent/licensing concerns.
 *
 * @param file    Source image file (e.g., HEIC/HEIF).
 * @param quality JPEG quality (0-1). Default 0.82.
 * @return JPEG File object.
 */
export async function canvasConvertToJpeg(
	file: File,
	quality = 0.82
): Promise< File > {
	const bitmap = await createImageBitmap( file );

	try {
		const canvas = new OffscreenCanvas( bitmap.width, bitmap.height );
		const ctx = canvas.getContext( '2d' );

		if ( ! ctx ) {
			throw new Error( 'Could not get canvas 2d context' );
		}

		ctx.drawImage( bitmap, 0, 0 );

		const jpegBlob = await canvas.convertToBlob( {
			type: 'image/jpeg',
			quality,
		} );

		const baseName = getFileBasename( file.name );

		return new File( [ jpegBlob ], `${ baseName }.jpeg`, {
			type: 'image/jpeg',
		} );
	} finally {
		bitmap.close();
	}
}
