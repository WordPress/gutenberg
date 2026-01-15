/**
 * External dependencies
 */
import { wrap, terminate, type Remote } from '@wordpress/worker-threads';

/**
 * Internal dependencies
 */
import type { ItemId, ImageSizeCrop } from './types';
import type { WorkerAPI } from './worker';
import { workerCode } from './worker-code';

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
		worker = new Worker( workerBlobUrl );
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
 * @param quality    Desired quality.
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Converted file buffer.
 */
export async function vipsConvertImageFormat(
	id: ItemId,
	buffer: ArrayBuffer,
	inputType: string,
	outputType: string,
	quality = 0.82,
	interlaced = false
): Promise< ArrayBuffer | ArrayBufferLike > {
	const api = getWorkerAPI();
	return api.convertImageFormat(
		id,
		buffer,
		inputType,
		outputType,
		quality,
		interlaced
	);
}

/**
 * Compresses an existing image using vips in a worker.
 *
 * @param id         Item ID.
 * @param buffer     Original file buffer.
 * @param type       Mime type.
 * @param quality    Desired quality.
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Compressed file buffer.
 */
export async function vipsCompressImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	quality = 0.82,
	interlaced = false
): Promise< ArrayBuffer | ArrayBufferLike > {
	const api = getWorkerAPI();
	return api.compressImage( id, buffer, type, quality, interlaced );
}

/**
 * Resizes an image using vips in a worker.
 *
 * @param id        Item ID.
 * @param buffer    Original file buffer.
 * @param type      Mime type.
 * @param resize    Resize options.
 * @param smartCrop Whether to use smart cropping (i.e. saliency-aware).
 * @return Processed file data plus the old and new dimensions.
 */
export async function vipsResizeImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	resize: ImageSizeCrop,
	smartCrop = false
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
	originalWidth: number;
	originalHeight: number;
} > {
	const api = getWorkerAPI();
	return api.resizeImage( id, buffer, type, resize, smartCrop );
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
