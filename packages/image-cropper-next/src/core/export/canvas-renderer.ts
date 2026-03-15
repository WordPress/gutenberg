/**
 * Internal dependencies
 */
import type { CropperState } from '../types';
import { createExportCamera } from '../camera';
import { degreesToRadians } from '../math/rotation';

/**
 * Load an image from a URL with CORS support.
 *
 * @param src - The image URL to load.
 * @return A promise that resolves to the loaded HTMLImageElement.
 */
export function loadImage( src: string ): Promise< HTMLImageElement > {
	return new Promise( ( resolve, reject ) => {
		const image = new Image();
		image.addEventListener( 'load', () => resolve( image ) );
		image.addEventListener( 'error', ( error ) => reject( error ) );
		image.crossOrigin = 'anonymous';
		image.src = src;
	} );
}

/**
 * Apply rectangular crop, rotation, and flip transforms to produce a canvas.
 *
 * Uses createExportCamera to compose the full transform matrix, then applies
 * it in a single ctx.setTransform call before drawing the image.
 *
 * @param image - The source image element.
 * @param state - The full cropper state containing crop, rotation, and flip settings.
 * @return A canvas element containing the transformed and cropped image.
 */
export function renderToCanvas(
	image: HTMLImageElement,
	state: CropperState
): HTMLCanvasElement {
	const { naturalWidth, naturalHeight } = image;
	const { rotation, cropRect } = state;
	const imageSize = { width: naturalWidth, height: naturalHeight };

	const rad = degreesToRadians( rotation );
	const cosR = Math.abs( Math.cos( rad ) );
	const sinR = Math.abs( Math.sin( rad ) );
	const rotW = cosR * naturalWidth + sinR * naturalHeight;
	const rotH = sinR * naturalWidth + cosR * naturalHeight;
	const outW = Math.round( cropRect.width * rotW );
	const outH = Math.round( cropRect.height * rotH );

	const canvas = document.createElement( 'canvas' );
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) {
		return canvas;
	}

	const camera = createExportCamera( state, imageSize, {
		width: outW,
		height: outH,
	} );
	ctx.setTransform(
		camera[ 0 ],
		camera[ 1 ],
		camera[ 2 ],
		camera[ 3 ],
		camera[ 4 ],
		camera[ 5 ]
	);
	ctx.drawImage( image, 0, 0 );
	return canvas;
}

/**
 * Convert a canvas to a Blob with configurable MIME type and quality.
 *
 * @param canvas   - The canvas to export.
 * @param mimeType - The output MIME type. Defaults to 'image/png'.
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to 0.92.
 * @return A promise that resolves to the canvas content as a Blob.
 */
export function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/png',
	quality: number = 0.92
): Promise< Blob > {
	return new Promise( ( resolve, reject ) => {
		canvas.toBlob(
			( blob ) => {
				if ( blob ) {
					resolve( blob );
				} else {
					reject( new Error( 'Canvas toBlob returned null.' ) );
				}
			},
			mimeType,
			quality
		);
	} );
}

/**
 * Convert a canvas to a data URL string.
 *
 * @param canvas   - The canvas to export.
 * @param mimeType - The output MIME type. Defaults to 'image/png'.
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to 0.92.
 * @return The canvas content as a data URL string.
 */
export function canvasToDataURL(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/png',
	quality: number = 0.92
): string {
	return canvas.toDataURL( mimeType, quality );
}

/**
 * High-level convenience: load an image, render with transforms, and export as a Blob.
 *
 * @param src      - The image URL to load.
 * @param state    - The cropper state with all transform settings.
 * @param mimeType - The output MIME type. Defaults to 'image/png'.
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to 0.92.
 * @return A promise that resolves to a Blob, or null if an error occurs.
 */
export async function exportCroppedImage(
	src: string,
	state: CropperState,
	mimeType: string = 'image/png',
	quality: number = 0.92
): Promise< Blob | null > {
	try {
		const image = await loadImage( src );
		const canvas = renderToCanvas( image, state );
		return await canvasToBlob( canvas, mimeType, quality );
	} catch {
		return null;
	}
}
