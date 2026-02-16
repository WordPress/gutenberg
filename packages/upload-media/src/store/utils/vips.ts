/**
 * Internal dependencies
 */
import { ImageFile } from '../../image-file';
import { getFileBasename } from '../../utils';
import type { ImageSizeCrop, QueueItemId } from '../types';

/**
 * Cached dynamic import promise for @wordpress/vips/worker.
 *
 * The module contains ~10MB of inlined WASM code. By using a dynamic import,
 * the WASM is only loaded when vips functions are actually called at image
 * processing time, rather than at module parse time.
 *
 * The promise is cached so the module is only resolved once.
 */
let vipsModulePromise:
	| Promise< typeof import('@wordpress/vips/worker') >
	| undefined;

/**
 * The resolved module reference, available synchronously after the first
 * load completes. Used by terminateVipsWorker() and vipsCancelOperations().
 */
let vipsModule: typeof import('@wordpress/vips/worker') | undefined;

/**
 * Lazily loads and caches the @wordpress/vips/worker module.
 *
 * @return The vips worker module.
 */
function loadVipsModule(): Promise< typeof import('@wordpress/vips/worker') > {
	if ( ! vipsModulePromise ) {
		vipsModulePromise = import( '@wordpress/vips/worker' ).then(
			( mod ) => {
				vipsModule = mod;
				return mod;
			}
		);
	}
	return vipsModulePromise;
}

/**
 * Converts an image to a different format using vips in a web worker.
 *
 * @param id         Queue item ID.
 * @param file       File object.
 * @param type       Output mime type.
 * @param quality    Desired quality (0-1).
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Converted file.
 */
export async function vipsConvertImageFormat(
	id: QueueItemId,
	file: File,
	type:
		| 'image/jpeg'
		| 'image/png'
		| 'image/webp'
		| 'image/avif'
		| 'image/gif',
	quality: number,
	interlaced?: boolean
) {
	const { vipsConvertImageFormat: convertImageFormat } =
		await loadVipsModule();
	const buffer = await convertImageFormat(
		id,
		await file.arrayBuffer(),
		file.type,
		type,
		quality,
		interlaced
	);
	const ext = type.split( '/' )[ 1 ];
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File( [ new Blob( [ buffer as ArrayBuffer ] ) ], fileName, {
		type,
	} );
}

/**
 * Compresses an image using vips in a web worker.
 *
 * @param id         Queue item ID.
 * @param file       File object.
 * @param quality    Desired quality (0-1).
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Compressed file.
 */
export async function vipsCompressImage(
	id: QueueItemId,
	file: File,
	quality: number,
	interlaced?: boolean
) {
	const { vipsCompressImage: compressImage } = await loadVipsModule();
	const buffer = await compressImage(
		id,
		await file.arrayBuffer(),
		file.type,
		quality,
		interlaced
	);
	return new File(
		[ new Blob( [ buffer as ArrayBuffer ], { type: file.type } ) ],
		file.name,
		{ type: file.type }
	);
}

/**
 * Checks whether an image has transparency using vips in a web worker.
 *
 * @param url Image URL.
 * @return Whether the image has transparency.
 */
export async function vipsHasTransparency( url: string ) {
	const { vipsHasTransparency: hasTransparency } = await loadVipsModule();
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Failed to fetch image: ${ response.status }` );
	}
	return hasTransparency( await response.arrayBuffer() );
}

/**
 * Resizes an image using vips in a web worker.
 *
 * @param id           Queue item ID.
 * @param file         File object.
 * @param resize       Resize options (width, height, crop).
 * @param smartCrop    Whether to use smart cropping (saliency-aware).
 * @param addSuffix    Whether to add dimension suffix to filename.
 * @param signal       Optional abort signal to cancel the operation.
 * @param scaledSuffix Whether to add '-scaled' suffix instead of dimensions (for big image threshold).
 * @return Resized ImageFile with dimension metadata.
 */
export async function vipsResizeImage(
	id: QueueItemId,
	file: File,
	resize: ImageSizeCrop,
	smartCrop: boolean,
	addSuffix: boolean,
	signal?: AbortSignal,
	scaledSuffix?: boolean
) {
	if ( signal?.aborted ) {
		throw new Error( 'Operation aborted' );
	}

	const { vipsResizeImage: resizeImage } = await loadVipsModule();
	const { buffer, width, height, originalWidth, originalHeight } =
		await resizeImage(
			id,
			await file.arrayBuffer(),
			file.type,
			resize,
			smartCrop
		);

	let fileName = file.name;
	const wasResized = originalWidth > width || originalHeight > height;

	if ( wasResized ) {
		const basename = getFileBasename( file.name );
		if ( scaledSuffix ) {
			// Add '-scaled' suffix for big image threshold resizing.
			// This matches WordPress core's behavior in wp_create_image_subsizes().
			fileName = file.name.replace( basename, `${ basename }-scaled` );
		} else if ( addSuffix ) {
			// Add dimension suffix for thumbnails.
			fileName = file.name.replace(
				basename,
				`${ basename }-${ width }x${ height }`
			);
		}
	}

	const resultFile = new ImageFile(
		new File(
			[ new Blob( [ buffer as ArrayBuffer ], { type: file.type } ) ],
			fileName,
			{
				type: file.type,
			}
		),
		width,
		height,
		originalWidth,
		originalHeight
	);

	return resultFile;
}

/**
 * Rotates an image based on EXIF orientation using vips in a web worker.
 *
 * This applies the correct rotation/flip transformation based on the EXIF
 * orientation value (1-8), and adds a '-rotated' suffix to the filename.
 * This matches WordPress core's behavior when rotating images based on EXIF.
 *
 * @param id          Queue item ID.
 * @param file        File object.
 * @param orientation EXIF orientation value (1-8).
 * @param signal      Optional abort signal to cancel the operation.
 * @return Rotated ImageFile with updated dimensions.
 */
export async function vipsRotateImage(
	id: QueueItemId,
	file: File,
	orientation: number,
	signal?: AbortSignal
) {
	if ( signal?.aborted ) {
		throw new Error( 'Operation aborted' );
	}

	// If orientation is 1 (normal), no rotation needed.
	if ( orientation === 1 ) {
		return file;
	}

	const { vipsRotateImage: rotateImage } = await loadVipsModule();
	const { buffer, width, height } = await rotateImage(
		id,
		await file.arrayBuffer(),
		file.type,
		orientation
	);

	// Add '-rotated' suffix to filename, matching WordPress core behavior.
	const basename = getFileBasename( file.name );
	const fileName = file.name.replace( basename, `${ basename }-rotated` );

	const resultFile = new ImageFile(
		new File(
			[ new Blob( [ buffer as ArrayBuffer ], { type: file.type } ) ],
			fileName,
			{
				type: file.type,
			}
		),
		width,
		height
	);

	return resultFile;
}

/**
 * Cancels all ongoing image operations for the given item.
 *
 * If the vips module has not been loaded yet, there can be no active
 * operations to cancel.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function vipsCancelOperations( id: QueueItemId ) {
	if ( ! vipsModule ) {
		return false;
	}
	return vipsModule.vipsCancelOperations( id );
}

/**
 * Terminates the vips worker if it has been loaded.
 *
 * If the vips module has not been loaded yet (i.e., no image processing
 * has occurred), this is a no-op since there is no worker to terminate.
 */
export function terminateVipsWorker(): void {
	if ( vipsModule ) {
		vipsModule.terminateVipsWorker();
	}
}
