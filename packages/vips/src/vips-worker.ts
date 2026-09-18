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
 * Cached promise for the lazily loaded vips-jxl.wasm bytes.
 *
 * The JXL WASM module is dynamically imported the first time a JXL image
 * is processed, keeping it out of the worker's static bundle. Subsequent
 * calls reuse the cached promise.
 */
let jxlWasmBytesPromise: Promise< ArrayBuffer > | undefined;

/**
 * The worker API the JXL bytes were last handed to.
 *
 * JXL support is worker-side state established by an RPC, so it does not
 * survive a worker recycle. Tracking the recipient lets `vipsEnsureJxlSupport`
 * detect a replaced worker and re-send, instead of assuming a single
 * successful call covers the rest of the session.
 */
let jxlWasmRecipient: Remote< WorkerAPI > | undefined;

/**
 * Ensures JXL support is available in the vips worker.
 *
 * Dynamically imports `wasm-vips/vips-jxl.wasm` on the main thread (which
 * the bundler splits into a separate chunk so it is only downloaded when
 * needed) and RPCs the resulting bytes to the worker. The worker wraps them
 * in a Blob URL and re-initializes vips with the JXL dynamic library on the
 * next operation.
 *
 * Safe to call multiple times: the download is cached, and the RPC is
 * repeated only when the worker has been replaced since the last call.
 */
export async function vipsEnsureJxlSupport(): Promise< void > {
	if ( ! jxlWasmBytesPromise ) {
		jxlWasmBytesPromise = ( async () => {
			// Externalized script module — the JXL WASM lives in its own
			// `@wordpress/vips/jxl-wasm` bundle (~3 MB) that is only
			// fetched by the browser on this dynamic import.
			const mod = await import( '@wordpress/vips/jxl-wasm' );
			const bytes = mod.default as Uint8Array< ArrayBuffer >;
			// Hand the RPC layer a bare ArrayBuffer: it only recognises those
			// as transferable, and walks any other object key by key — which
			// for ~3 MB of image codec means millions of main-thread
			// allocations per call. `slice` also detaches this copy from the
			// module's own bytes, so transferring it cannot empty the cache.
			return bytes.buffer.slice(
				bytes.byteOffset,
				bytes.byteOffset + bytes.byteLength
			);
		} )().catch( ( error ) => {
			// Do not cache the failure: a transient network error fetching the
			// chunk would otherwise disable JXL for the rest of the session.
			jxlWasmBytesPromise = undefined;
			throw error;
		} );
	}

	const bytes = await jxlWasmBytesPromise;
	const api = getWorkerAPI();

	if ( jxlWasmRecipient === api ) {
		return;
	}

	// The buffer is transferred, so hand over a fresh copy each time and keep
	// the cached original intact for the next worker.
	await api.setJxlWasm( bytes.slice( 0 ) );
	jxlWasmRecipient = api;
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
	// The downloaded bytes stay cached - only the worker-side state is gone,
	// and vipsEnsureJxlSupport re-sends it when it sees a new worker.
	jxlWasmRecipient = undefined;
}
