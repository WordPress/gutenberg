/**
 * Image processing utilities for the media editor.
 * These utilities handle canvas operations for cropping and transforming images.
 *
 * Note: getCroppedImage is available through the useImageCropper hook
 * from @wordpress/image-cropper, not exported here.
 */

/**
 * Converts a canvas to a Blob.
 *
 * @param canvas   - The canvas element to convert
 * @param mimeType - The MIME type for the output (default: 'image/jpeg')
 * @return Promise resolving to the Blob
 */
export function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/jpeg'
): Promise< Blob > {
	return new Promise( ( resolve, reject ) => {
		canvas.toBlob( ( blob ) => {
			if ( blob ) {
				resolve( blob );
			} else {
				reject( new Error( 'Failed to convert canvas to blob' ) );
			}
		}, mimeType );
	} );
}

/**
 * Creates an HTMLImageElement from a URL.
 *
 * @param url - The URL of the image to load
 * @return Promise resolving to the loaded image
 */
export function createImageFromUrl( url: string ): Promise< HTMLImageElement > {
	return new Promise( ( resolve, reject ) => {
		const image = new Image();
		image.addEventListener( 'load', () => resolve( image ) );
		image.addEventListener( 'error', ( error ) => reject( error ) );
		image.setAttribute( 'crossOrigin', 'anonymous' );
		image.src = url;
	} );
}
