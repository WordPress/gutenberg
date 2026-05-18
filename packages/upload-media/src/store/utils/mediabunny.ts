/**
 * Internal dependencies
 */
import { getFileBasename } from '../../utils';
import type { QueueItemId } from '../types';

/**
 * Message prefix used by @wordpress/mediabunny to flag an
 * unsupported-but-graceful conversion outcome (no WebCodecs, unsupported
 * codec). This MUST mirror the package's exported `UNSUPPORTED_ERROR_PREFIX`.
 *
 * It is duplicated here rather than imported because the only path that
 * carries the constant (`@wordpress/mediabunny`) statically pulls the heavy
 * mediabunny library into the main bundle, defeating the lazy worker load.
 * The worker RPC layer (comctx) also serializes a thrown error to its
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
 * @param error Error thrown by `mediabunnyConvertGifToVideo`.
 * @return Whether the error is a graceful "unsupported" outcome.
 */
export function isUnsupportedConversionError( error: unknown ): boolean {
	return (
		error instanceof Error &&
		error.message.startsWith( UNSUPPORTED_ERROR_PREFIX )
	);
}

/**
 * Cached dynamic import promise for @wordpress/mediabunny/worker.
 *
 * Using a dynamic import keeps the worker module out of the main bundle; it
 * is fetched only when GIF-to-video conversion is actually triggered.
 */
let mediabunnyModulePromise:
	| Promise< typeof import('@wordpress/mediabunny/worker') >
	| undefined;

/**
 * The resolved module reference, available synchronously after first load.
 */
let mediabunnyModule: typeof import('@wordpress/mediabunny/worker') | undefined;

/**
 * Lazily loads and caches the @wordpress/mediabunny/worker module.
 *
 * @return The mediabunny worker module.
 */
function loadMediabunnyModule(): Promise<
	typeof import('@wordpress/mediabunny/worker')
> {
	if ( ! mediabunnyModulePromise ) {
		mediabunnyModulePromise = import( '@wordpress/mediabunny/worker' ).then(
			( mod ) => {
				mediabunnyModule = mod;
				return mod;
			}
		);
	}
	return mediabunnyModulePromise;
}

/**
 * Converts an animated GIF to a video file using mediabunny in a web worker.
 *
 * @param id             Queue item ID.
 * @param file           GIF file object.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Converted video file.
 */
export async function mediabunnyConvertGifToVideo(
	id: QueueItemId,
	file: File,
	outputMimeType: string,
	maxDimensions?: number
) {
	const { mediabunnyConvertGifToVideo: convert } =
		await loadMediabunnyModule();
	const buffer = await convert(
		id,
		await file.arrayBuffer(),
		outputMimeType,
		maxDimensions
	);

	const ext = outputMimeType === 'video/webm' ? 'webm' : 'mp4';
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File(
		[ new Blob( [ buffer as ArrayBuffer ], { type: outputMimeType } ) ],
		fileName,
		{ type: outputMimeType }
	);
}

/**
 * Cancels all ongoing mediabunny operations for the given item.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function mediabunnyCancelOperations( id: QueueItemId ) {
	if ( ! mediabunnyModule ) {
		return false;
	}
	return mediabunnyModule.mediabunnyCancelOperations( id );
}

/**
 * Terminates the mediabunny worker if it has been loaded.
 */
export function terminateMediabunnyWorker(): void {
	if ( mediabunnyModule ) {
		mediabunnyModule.terminateMediabunnyWorker();
	}
}
