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
 * Gets or creates the video conversion worker instance.
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
 * Converts an animated GIF to a video file using the worker pipeline.
 *
 * @param id             Item ID.
 * @param gifSource      GIF file as a Blob/File or ArrayBuffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Video file buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	gifSource: ArrayBuffer | Blob,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	const api = getWorkerAPI();
	return api.convertGifToVideo(
		id,
		gifSource,
		outputMimeType,
		maxDimensions
	);
}

/**
 * Cancels all ongoing GIF-to-video conversions for a given item ID.
 *
 * @param id Item ID.
 * @return Whether any operation was cancelled.
 */
export async function cancelGifToVideoOperations(
	id: ItemId
): Promise< boolean > {
	const api = getWorkerAPI();
	return api.cancelOperations( id );
}

/**
 * Terminates the video conversion worker if it exists.
 * Call this to free up resources when video conversion is no longer needed.
 */
export function terminateVideoConversionWorker(): void {
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
