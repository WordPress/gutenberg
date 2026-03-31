/**
 * External dependencies
 */
import { wrap, terminate, type Remote } from '@wordpress/worker-threads';

/**
 * Internal dependencies
 */
import type { ItemId } from './types';
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
 * Gets or creates the FFmpeg worker instance.
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
 * Converts an animated GIF to a video file using FFmpeg in a worker.
 *
 * @param id             Item ID.
 * @param buffer         GIF file buffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimensions for scaling.
 * @return Video file buffer.
 */
export async function ffmpegConvertGifToVideo(
	id: ItemId,
	buffer: ArrayBuffer,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	const api = getWorkerAPI();
	return api.convertGifToVideo( id, buffer, outputMimeType, maxDimensions );
}

/**
 * Cancels all ongoing operations for the given item.
 *
 * @param id Item ID.
 * @return Whether any operation was cancelled.
 */
export async function ffmpegCancelOperations( id: ItemId ): Promise< boolean > {
	const api = getWorkerAPI();
	return api.cancelOperations( id );
}

/**
 * Terminates the FFmpeg worker if it exists.
 * Call this to free up resources when FFmpeg processing is no longer needed.
 */
export function terminateFFmpegWorker(): void {
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
