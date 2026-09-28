import { wrap, terminate, type Remote } from '@wordpress/worker-threads';
import type {
	ItemId,
	ImageSizeCrop,
	ConvertImageOptions,
	ResizeImageOptions,
} from './types.ts';
import type { WorkerAPI } from './worker.ts';
import { workerCode } from './worker-code.ts';

/**
 * The worker instance, lazily created on first use.
 */
let worker: Worker | undefined;

/**
 * The wrapped worker API for RPC calls.
 */
let workerAPI: Remote< WorkerAPI > | undefined;

/**
 * The Blob URL for the worker, kept for cleanup.
 */
let workerBlobUrl: string | undefined;

/**
 * Gets or creates the vips worker instance.
 * Uses lazy initialization to only create the worker when needed.
 *
 * The worker code is bundled inline and loaded via a Blob URL.
 * This avoids issues with import.meta.url not being available
 * when the code is bundled via webpack.
 *
 * @return The wrapped worker API.
 */
function getWorkerAPI(): Remote< WorkerAPI > {
	if ( workerAPI === undefined ) {
		// Create worker from inline code via Blob URL.
		// This approach works regardless of how the code is bundled.
		const blob = new Blob( [ workerCode ], {
			type: 'application/javascript',
		} );
		workerBlobUrl = URL.createObjectURL( blob );
		worker = new Worker( workerBlobUrl, { type: 'module' } );
		workerAPI = wrap< WorkerAPI >( worker );
	}
	return workerAPI;
}

/**
 * Converts an image to a different format using vips in a worker.
 *
 * @param id         Item ID.
 * @param buffer     Original file buffer.
 * @param inputType  Input mime type.
 * @param outputType Output mime type.
 * @param options    Conversion options.
 * @return Converted file buffer.
 */
export async function vipsConvertImageFormat(
	id: ItemId,
	buffer: ArrayBuffer,
	inputType: string,
	outputType: string,
	options: ConvertImageOptions = {}
): Promise< ArrayBuffer | ArrayBufferLike > {
	const api = getWorkerAPI();
	return api.convertImageFormat( id, buffer, inputType, outputType, options );
}

/**
 * Compresses an existing image using vips in a worker.
 *
 * @param id      Item ID.
 * @param buffer  Original file buffer.
 * @param type    Mime type.
 * @param options Compression options.
 * @return Compressed file buffer.
 */
export async function vipsCompressImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	options: ConvertImageOptions = {}
): Promise< ArrayBuffer | ArrayBufferLike > {
	const api = getWorkerAPI();
	return api.compressImage( id, buffer, type, options );
}

/**
 * Resizes an image using vips in a worker.
 *
 * UltraHDR JPEGs are auto-detected by libvips and their gain map is
 * preserved through the resize.
 *
 * @param id      Item ID.
 * @param buffer  Original file buffer.
 * @param type    Mime type.
 * @param resize  Resize options.
 * @param options Additional resize options.
 * @return Processed file data plus the old and new dimensions.
 */
export async function vipsResizeImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	resize: ImageSizeCrop,
	options: ResizeImageOptions = {}
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
	originalWidth: number;
	originalHeight: number;
} > {
	const api = getWorkerAPI();
	return api.resizeImage( id, buffer, type, resize, options );
}

/**
 * Determines whether an image has an alpha channel using vips in a worker.
 *
 * @param buffer Original file buffer.
 * @return Whether the image has an alpha channel.
 */
export async function vipsHasTransparency(
	buffer: ArrayBuffer
): Promise< boolean > {
	const api = getWorkerAPI();
	return api.hasTransparency( buffer );
}

/**
 * Probes a JPEG buffer for UltraHDR (ISO 21496-1 gain map) support using vips
 * in a worker.
 *
 * @param buffer Image buffer to probe.
 * @return UltraHDR info (dimensions and HDR headroom in stops) if the buffer
 *         is a valid UltraHDR JPEG; otherwise null.
 */
export async function vipsGetUltraHdrInfo( buffer: ArrayBuffer ): Promise< {
	width: number;
	height: number;
	hdrCapacity: number;
} | null > {
	const api = getWorkerAPI();
	return api.getUltraHdrInfo( buffer );
}

/**
 * Rotates an image based on EXIF orientation using vips in a worker.
 *
 * @param id          Item ID.
 * @param buffer      Original file buffer.
 * @param type        Mime type.
 * @param orientation EXIF orientation value (1-8).
 * @return Rotated file data plus the new dimensions.
 */
export async function vipsRotateImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	orientation: number
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
} > {
	const api = getWorkerAPI();
	return api.rotateImage( id, buffer, type, orientation );
}

/**
 * Cancels all ongoing image operations for a given item ID.
 *
 * @param id Item ID.
 * @return Whether any operation was cancelled.
 */
export async function vipsCancelOperations( id: ItemId ): Promise< boolean > {
	const api = getWorkerAPI();
	return api.cancelOperations( id );
}

/**
 * Terminates the vips worker if it exists.
 * Call this to free up resources when vips processing is no longer needed.
 */
export function terminateVipsWorker(): void {
	if ( workerAPI ) {
		terminate( workerAPI );
		workerAPI = undefined;
		worker = undefined;
	}
	if ( workerBlobUrl ) {
		URL.revokeObjectURL( workerBlobUrl );
		workerBlobUrl = undefined;
	}
}
