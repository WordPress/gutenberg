/**
 * Internal dependencies
 */
import type { CropperState } from '../types';
import { createExportCamera, getRotatedBBox } from '../camera';

/** Default export quality for lossy formats (JPEG, WebP). */
const DEFAULT_QUALITY = 0.92;

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

	// Output size is the crop region in the snap-rotation bbox — matches
	// the preview's reference frame so the exported pixels track exactly
	// what the stencil framed, even at fine rotation angles.
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const rotBBox = getRotatedBBox( naturalWidth, naturalHeight, snapRotation );
	const outW = Math.round( cropRect.width * rotBBox.width );
	const outH = Math.round( cropRect.height * rotBBox.height );

	const canvas = document.createElement( 'canvas' );
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) {
		throw new Error(
			'Could not obtain a 2D context for the export canvas.'
		);
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
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to DEFAULT_QUALITY.
 * @return A promise that resolves to the canvas content as a Blob.
 */
export function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/png',
	quality: number = DEFAULT_QUALITY
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
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to DEFAULT_QUALITY.
 * @return The canvas content as a data URL string.
 */
export function canvasToDataURL(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/png',
	quality: number = DEFAULT_QUALITY
): string {
	return canvas.toDataURL( mimeType, quality );
}

/**
 * Load an image, render with transforms, and export as a Blob.
 *
 * Throws on failure so callers can distinguish error cases:
 * - Image load failures (network errors, 404s) throw the native
 *   load error from the Image element.
 * - Cross-origin failures manifest as tainted-canvas errors from
 *   `canvas.toBlob()` — the browser rejects reading pixel data
 *   from a canvas that drew an image without valid CORS headers.
 *   Ensure the source server sets `Access-Control-Allow-Origin`.
 * - Canvas context creation failures throw a descriptive Error.
 *
 * Only works in browser environments (needs DOM / HTMLCanvasElement).
 *
 * @param src      - The image URL to load.
 * @param state    - The cropper state with all transform settings.
 * @param mimeType - The output MIME type. Defaults to 'image/png'.
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to DEFAULT_QUALITY.
 * @return A promise that resolves to the exported Blob.
 * @throws If the image fails to load, canvas creation fails, or
 *         the resulting canvas is tainted by CORS restrictions.
 */
export async function exportCroppedImage(
	src: string,
	state: CropperState,
	mimeType: string = 'image/png',
	quality: number = DEFAULT_QUALITY
): Promise< Blob > {
	const image = await loadImage( src );
	const canvas = renderToCanvas( image, state );
	return canvasToBlob( canvas, mimeType, quality );
}

/**
 * Apply the cropper's transform (crop, rotation, flip, zoom) to an existing
 * canvas or image source. This is the bridge for multi-step editing pipelines
 * where an upstream tool (e.g., brightness/color adjustment) has already
 * processed the image and you want to apply the crop on top.
 *
 * Accepts any CanvasImageSource: HTMLImageElement, HTMLCanvasElement,
 * OffscreenCanvas, ImageBitmap, HTMLVideoElement, etc.
 *
 * @param source            - The image source to crop/transform.
 * @param sourceSize        - The dimensions of the source (natural width/height).
 * @param sourceSize.width  - The width of the source in pixels.
 * @param sourceSize.height - The height of the source in pixels.
 * @param state             - The cropper state with all transform settings.
 * @param outputSize        - Optional output size. Defaults to the crop region's natural pixel size.
 * @param outputSize.width  - The width of the output in pixels.
 * @param outputSize.height - The height of the output in pixels.
 * @return A canvas with the transforms applied.
 */
export function applyToCanvas(
	source: CanvasImageSource,
	sourceSize: { width: number; height: number },
	state: CropperState,
	outputSize?: { width: number; height: number }
): HTMLCanvasElement {
	// Use snap-rotation bbox for default sizing so the default output
	// matches the preview's reference frame at fine rotation angles
	// (see renderToCanvas / createExportCamera).
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const rotBBox = getRotatedBBox(
		sourceSize.width,
		sourceSize.height,
		snapRotation
	);

	// Default output size: the crop region in natural pixels.
	const outW =
		outputSize?.width ?? Math.round( state.cropRect.width * rotBBox.width );
	const outH =
		outputSize?.height ??
		Math.round( state.cropRect.height * rotBBox.height );

	const canvas = document.createElement( 'canvas' );
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) {
		throw new Error(
			'Could not obtain a 2D context for the export canvas.'
		);
	}

	const camera = createExportCamera( state, sourceSize, {
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
	ctx.drawImage( source, 0, 0 );
	return canvas;
}

/**
 * Download the cropped image as a file.
 *
 * Loads the source image, applies all transforms, and triggers a
 * browser download via exportCroppedImage() + object URL + anchor click.
 *
 * Throws on export failure (see `exportCroppedImage`).
 *
 * @param src      - The image URL to load.
 * @param state    - The cropper state with all transform settings.
 * @param filename - The download filename. Defaults to 'cropped-image'.
 * @param mimeType - The output MIME type. Defaults to 'image/png'.
 * @param quality  - The quality parameter for lossy formats (0-1). Defaults to DEFAULT_QUALITY.
 * @return A promise that resolves when the download is triggered.
 */
export async function downloadCroppedImage(
	src: string,
	state: CropperState,
	filename: string = 'cropped-image',
	mimeType: string = 'image/png',
	quality: number = DEFAULT_QUALITY
): Promise< void > {
	const blob = await exportCroppedImage( src, state, mimeType, quality );
	const ext = mimeType.split( '/' )[ 1 ] ?? 'png';
	const url = URL.createObjectURL( blob );
	const a = document.createElement( 'a' );
	a.href = url;
	a.download = `${ filename }.${ ext }`;
	a.click();
	URL.revokeObjectURL( url );
}
