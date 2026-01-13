/**
 * External dependencies
 */
import { createWorkerFactory, terminate } from '@shopify/web-worker';

/**
 * Internal dependencies
 */
import type { ItemId, ImageSizeCrop } from './types';

/**
 * Creates a worker factory for the vips worker module.
 * The webpackChunkName comment ensures consistent naming of the worker chunk.
 */
const createVipsWorker = createWorkerFactory(
	() => import( /* webpackChunkName: 'vips' */ './worker' )
);

type WorkerCreator = ReturnType< typeof createVipsWorker >;

let vipsWorker: WorkerCreator | undefined;

/**
 * Gets or creates the vips worker instance.
 * Uses lazy initialization to only create the worker when needed.
 *
 * @return The vips worker instance.
 */
function getVipsWorker(): WorkerCreator {
	if ( vipsWorker === undefined ) {
		vipsWorker = createVipsWorker();
	}
	return vipsWorker;
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
	const worker = getVipsWorker();
	return worker.convertImageFormat(
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
	const worker = getVipsWorker();
	return worker.compressImage( id, buffer, type, quality, interlaced );
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
	const worker = getVipsWorker();
	return worker.resizeImage( id, buffer, type, resize, smartCrop );
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
	const worker = getVipsWorker();
	return worker.hasTransparency( buffer );
}

/**
 * Cancels all ongoing image operations for a given item ID.
 *
 * @param id Item ID.
 * @return Whether any operation was cancelled.
 */
export async function vipsCancelOperations( id: ItemId ): Promise< boolean > {
	const worker = getVipsWorker();
	return worker.cancelOperations( id );
}

/**
 * Terminates the vips worker if it exists.
 * Call this to free up resources when vips processing is no longer needed.
 */
export function terminateVipsWorker(): void {
	if ( vipsWorker ) {
		terminate( vipsWorker );
		vipsWorker = undefined;
	}
}
