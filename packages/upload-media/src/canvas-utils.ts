/**
 * Internal dependencies
 */
import { getFileBasename } from './utils';

/**
 * Converts an image file to JPEG using the browser's native decoder and canvas.
 *
 * Tries two decoding strategies:
 * 1. createImageBitmap() + OffscreenCanvas (works in Safari, future Chrome).
 * 2. <img> element + HTMLCanvasElement (works in Chrome on macOS, which
 *    exposes OS-level HEIC decoding through the <img> rendering pipeline
 *    but not through createImageBitmap).
 *
 * This avoids shipping our own HEVC decoder, sidestepping patent/licensing concerns.
 *
 * @param file    Source image file (e.g., HEIC/HEIF).
 * @param quality JPEG quality (0-1). Default 0.82.
 * @return JPEG File object.
 */
export async function canvasConvertToJpeg(
	file: File,
	quality = 0.82
): Promise< File > {
	const baseName = getFileBasename( file.name );

	// Strategy 1: createImageBitmap + OffscreenCanvas.
	try {
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

			return new File( [ jpegBlob ], `${ baseName }.jpeg`, {
				type: 'image/jpeg',
			} );
		} finally {
			bitmap.close();
		}
	} catch {
		// createImageBitmap doesn't support HEIC in this browser.
		// Fall through to strategy 2.
	}

	// Strategy 2: <img> element + HTMLCanvasElement.
	// Chrome on macOS can decode HEIC via the <img> rendering pipeline
	// using OS-level codecs, even though createImageBitmap cannot.
	const blobUrl = URL.createObjectURL( file );

	try {
		const img = await new Promise< HTMLImageElement >(
			( resolve, reject ) => {
				const image = new Image();
				image.onload = () => resolve( image );
				image.onerror = () =>
					reject(
						new Error( 'Image element could not decode the file' )
					);
				image.src = blobUrl;
			}
		);

		const canvas = document.createElement( 'canvas' );
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;

		const ctx = canvas.getContext( '2d' );
		if ( ! ctx ) {
			throw new Error( 'Could not get canvas 2d context' );
		}

		ctx.drawImage( img, 0, 0 );

		const jpegBlob = await new Promise< Blob >( ( resolve, reject ) => {
			canvas.toBlob(
				( blob ) => {
					if ( blob ) {
						resolve( blob );
					} else {
						reject( new Error( 'Canvas toBlob returned null' ) );
					}
				},
				'image/jpeg',
				quality
			);
		} );

		return new File( [ jpegBlob ], `${ baseName }.jpeg`, {
			type: 'image/jpeg',
		} );
	} finally {
		URL.revokeObjectURL( blobUrl );
	}
}
