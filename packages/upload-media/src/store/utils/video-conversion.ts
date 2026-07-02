/**
 * Internal dependencies
 */
import { getFileBasename } from '../../utils';
import type { QueueItemId } from '../types';

/**
 * Message prefix used by @wordpress/video-conversion to flag an
 * unsupported-but-graceful conversion outcome (no WebCodecs, unsupported
 * codec). This MUST mirror the package's exported `UNSUPPORTED_ERROR_PREFIX`.
 *
 * It is duplicated here rather than imported because the only path that
 * carries the constant (`@wordpress/video-conversion`) statically pulls the
 * heavy encoder library into the main bundle, defeating the lazy worker
 * load. The worker RPC layer (comctx) also serializes a thrown error to its
 * `message` string only, so the cross-boundary contract is inherently a
 * message prefix. `isUnsupportedConversionError` is unit-tested against the
 * exact strings the worker throws to catch any drift.
 */
const UNSUPPORTED_ERROR_PREFIX = 'Unsupported';

/**
 * Whether an error from GIF-to-video conversion represents an
 * unsupported-but-graceful outcome (caller should fall back to uploading the
 * original GIF) rather than a hard failure.
 *
 * @param error Error thrown by `convertGifToVideo`.
 * @return Whether the error is a graceful "unsupported" outcome.
 */
export function isUnsupportedConversionError( error: unknown ): boolean {
	return (
		error instanceof Error &&
		error.message.startsWith( UNSUPPORTED_ERROR_PREFIX )
	);
}

/**
 * Cached dynamic import promise for @wordpress/video-conversion/worker.
 *
 * Using a dynamic import keeps the worker module out of the main bundle; it
 * is fetched only when GIF-to-video conversion is actually triggered.
 */
let videoConversionModulePromise:
	| Promise< typeof import('@wordpress/video-conversion/worker') >
	| undefined;

/**
 * The resolved module reference, available synchronously after first load.
 */
let videoConversionModule:
	| typeof import('@wordpress/video-conversion/worker')
	| undefined;

/**
 * Lazily loads and caches the @wordpress/video-conversion/worker module.
 *
 * @return The video conversion worker module.
 */
function loadVideoConversionModule(): Promise<
	typeof import('@wordpress/video-conversion/worker')
> {
	if ( ! videoConversionModulePromise ) {
		videoConversionModulePromise = import(
			'@wordpress/video-conversion/worker'
		)
			.then( ( mod ) => {
				videoConversionModule = mod;
				return mod;
			} )
			.catch( ( error ) => {
				/*
				 * Reset the cached promise so a transient chunk-load failure
				 * does not permanently break later conversions; the next call
				 * retries the import.
				 */
				videoConversionModulePromise = undefined;
				throw error;
			} );
	}
	return videoConversionModulePromise;
}

/**
 * Converts an animated GIF to a video file using the video conversion worker.
 *
 * @param id             Queue item ID.
 * @param file           GIF file object.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Converted video file.
 */
export async function convertGifToVideo(
	id: QueueItemId,
	file: File,
	outputMimeType: string,
	maxDimensions?: number
) {
	const { convertGifToVideo: convert } = await loadVideoConversionModule();
	// Pass the File straight through: the worker reads its bytes once, off
	// the main thread, instead of materializing an ArrayBuffer here.
	const buffer = await convert( id, file, outputMimeType, maxDimensions );

	const ext = outputMimeType === 'video/webm' ? 'webm' : 'mp4';
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File(
		[ new Blob( [ buffer as ArrayBuffer ], { type: outputMimeType } ) ],
		fileName,
		{ type: outputMimeType }
	);
}

/**
 * Cancels all ongoing GIF-to-video conversions for the given item.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function cancelGifToVideoOperations( id: QueueItemId ) {
	/*
	 * Resolve the worker even if it is still loading so a cancel issued during
	 * the initial lazy-load window is not silently dropped (which would let the
	 * conversion keep running for an item the caller already cancelled).
	 */
	const mod =
		videoConversionModule ??
		( videoConversionModulePromise
			? await videoConversionModulePromise.catch( () => undefined )
			: undefined );
	if ( ! mod ) {
		return false;
	}
	return mod.cancelGifToVideoOperations( id );
}

/**
 * Terminates the video conversion worker if it has been loaded.
 */
export function terminateVideoConversionWorker(): void {
	if ( videoConversionModule ) {
		videoConversionModule.terminateVideoConversionWorker();
		return;
	}
	/*
	 * The worker is still loading. Terminate it once the import resolves so a
	 * teardown issued during the lazy-load window is honored rather than
	 * leaving the worker resident.
	 */
	if ( videoConversionModulePromise ) {
		void videoConversionModulePromise
			.then( ( mod ) => mod.terminateVideoConversionWorker() )
			.catch( () => {} );
	}
}
