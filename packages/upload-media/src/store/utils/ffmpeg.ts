/**
 * Internal dependencies
 */
import { getFileBasename } from '../../utils';
import type { QueueItemId } from '../types';
import type { FFmpegConfig } from './ffmpeg-plugin';

/**
 * Cached dynamic import promise for @wordpress/ffmpeg/worker.
 *
 * The module is a thin RPC wrapper. The heavy FFmpeg WASM binary is
 * loaded separately from the wp-ffmpeg-wasm plugin's assets directory.
 *
 * The promise is cached so the module is only resolved once.
 */
let ffmpegModulePromise:
	| Promise< typeof import('@wordpress/ffmpeg/worker') >
	| undefined;

/**
 * The resolved module reference, available synchronously after the first
 * load completes. Used by terminateFFmpegWorker() and ffmpegCancelOperations().
 */
let ffmpegModule: typeof import('@wordpress/ffmpeg/worker') | undefined;

/**
 * Lazily loads and caches the @wordpress/ffmpeg/worker module.
 *
 * @return The FFmpeg worker module.
 */
function loadFFmpegModule(): Promise<
	typeof import('@wordpress/ffmpeg/worker')
> {
	if ( ! ffmpegModulePromise ) {
		ffmpegModulePromise = import( '@wordpress/ffmpeg/worker' ).then(
			( mod ) => {
				ffmpegModule = mod;
				return mod;
			}
		);
	}
	return ffmpegModulePromise;
}

/**
 * Converts an animated GIF to a video file using FFmpeg in a web worker.
 *
 * @param id             Queue item ID.
 * @param file           GIF file object.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param config         WASM configuration from the wp-ffmpeg-wasm plugin.
 * @param maxDimensions  Optional maximum dimensions for scaling.
 * @return Converted video file.
 */
export async function ffmpegConvertGifToVideo(
	id: QueueItemId,
	file: File,
	outputMimeType: string,
	config: FFmpegConfig,
	maxDimensions?: number
) {
	const { ffmpegConvertGifToVideo: convertGifToVideo } =
		await loadFFmpegModule();
	const buffer = await convertGifToVideo(
		id,
		await file.arrayBuffer(),
		outputMimeType,
		config,
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
 * Cancels all ongoing FFmpeg operations for the given item.
 *
 * If the FFmpeg module has not been loaded yet, there can be no active
 * operations to cancel.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function ffmpegCancelOperations( id: QueueItemId ) {
	if ( ! ffmpegModule ) {
		return false;
	}
	return ffmpegModule.ffmpegCancelOperations( id );
}

/**
 * Terminates the FFmpeg worker if it has been loaded.
 *
 * If the FFmpeg module has not been loaded yet (i.e., no GIF conversion
 * has occurred), this is a no-op since there is no worker to terminate.
 */
export function terminateFFmpegWorker(): void {
	if ( ffmpegModule ) {
		ffmpegModule.terminateFFmpegWorker();
	}
}
