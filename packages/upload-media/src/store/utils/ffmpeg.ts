/**
 * Internal dependencies
 */
import { getFileBasename } from '../../utils';
import type { QueueItemId } from '../types';
import type { FFmpegConfig } from './ffmpeg-plugin';

/**
 * Inline worker code for FFmpeg GIF-to-video conversion.
 *
 * This runs in a classic worker (not a module worker) because the
 * Emscripten-compiled FFmpeg core JS must be loaded via importScripts().
 * The FFmpeg WASM binary is provided by the wp-ffmpeg-wasm plugin and
 * loaded from its assets URL at runtime.
 */
const workerCode = `
var ffmpegModule = null;

self.onmessage = function( e ) {
	var data = e.data;
	if ( data.type !== 'convert' ) {
		return;
	}

	( async function() {
		try {
			// Load FFmpeg core on first use.
			if ( ! ffmpegModule ) {
				importScripts( data.coreUrl );
				ffmpegModule = await self.createFFmpegCore( {
					print: function() {},
					printErr: function() {},
				} );
			}

			var inputName = 'input.gif';
			var isWebm = data.outputFormat === 'webm';
			var ext = isWebm ? 'webm' : 'mp4';
			var outputName = 'output.' + ext;

			// Write input file to Emscripten virtual filesystem.
			ffmpegModule.FS.writeFile( inputName, new Uint8Array( data.inputBuffer ) );

			// Build FFmpeg arguments.
			var args = [ '-nostdin', '-y', '-i', inputName ];

			// Video codec selection.
			if ( isWebm ) {
				args.push( '-c:v', 'libvpx-vp9' );
				args.push( '-crf', '31', '-b:v', '0' );
			} else {
				args.push( '-c:v', 'libx264' );
				args.push( '-preset', 'fast' );
			}

			// Common settings.
			args.push( '-r', '24' );
			args.push( '-pix_fmt', 'yuv420p' );

			// Scale filter: ensure even dimensions (required by most codecs),
			// and optionally scale down if exceeding maxDimensions.
			if ( data.maxDimensions ) {
				var max = data.maxDimensions + ( data.maxDimensions % 2 );
				args.push(
					'-vf',
					"scale='min(" + max + ",trunc(iw/2)*2)':'min(" + max + ",trunc(ih/2)*2)':flags=lanczos"
				);
			} else {
				args.push( '-vf', "scale='trunc(iw/2)*2':'trunc(ih/2)*2'" );
			}

			// MP4: move metadata to the beginning for streaming.
			if ( ! isWebm ) {
				args.push( '-movflags', '+faststart' );
			}

			// Remove audio (GIFs don't have audio).
			args.push( '-an' );
			args.push( outputName );

			// Run FFmpeg.
			ffmpegModule.setTimeout( -1 );
			ffmpegModule.exec.apply( ffmpegModule, args );

			// Read output file.
			var output = ffmpegModule.FS.readFile( outputName );
			if ( ! output || output.length === 0 ) {
				throw new Error( 'FFmpeg produced empty output' );
			}

			// Extract only the relevant bytes.
			var buffer = output.buffer.slice(
				output.byteOffset,
				output.byteOffset + output.byteLength
			);

			// Cleanup virtual filesystem and reset state.
			try {
				ffmpegModule.FS.unlink( inputName );
				ffmpegModule.FS.unlink( outputName );
			} catch ( _e ) {
				// Ignore cleanup errors.
			}
			ffmpegModule.reset();

			self.postMessage( { type: 'result', buffer: buffer }, [ buffer ] );
		} catch ( err ) {
			self.postMessage( { type: 'error', message: err.message || String( err ) } );
		}
	} )();
};
`;

/**
 * The worker instance, lazily created on first use.
 */
let worker: Worker | undefined;

/**
 * The Blob URL for the worker, kept for cleanup.
 */
let workerBlobUrl: string | undefined;

/**
 * Gets or creates the FFmpeg worker instance.
 *
 * @return The worker.
 */
function getOrCreateWorker(): Worker {
	if ( ! worker ) {
		const blob = new Blob( [ workerCode ], {
			type: 'application/javascript',
		} );
		workerBlobUrl = URL.createObjectURL( blob );
		worker = new Worker( workerBlobUrl );
	}
	return worker;
}

/**
 * Converts an animated GIF to a video file using FFmpeg in a web worker.
 *
 * The FFmpeg WASM binary is loaded from the wp-ffmpeg-wasm plugin's
 * assets URL. The conversion runs entirely in a worker to avoid
 * blocking the main thread.
 *
 * @param id            Queue item ID.
 * @param file          GIF file object.
 * @param config        WASM configuration from the wp-ffmpeg-wasm plugin.
 * @param outputFormat  Output format: 'mp4' or 'webm'.
 * @param maxDimensions Optional maximum dimensions for scaling.
 * @return Converted video file.
 */
export async function ffmpegConvertGifToVideo(
	id: QueueItemId,
	file: File,
	config: FFmpegConfig,
	outputFormat: 'mp4' | 'webm' = 'mp4',
	maxDimensions?: number
): Promise< File > {
	const w = getOrCreateWorker();
	const inputBuffer = await file.arrayBuffer();

	return new Promise< File >( ( resolve, reject ) => {
		const handler = ( e: MessageEvent ) => {
			if ( e.data.type === 'result' ) {
				w.removeEventListener( 'message', handler );
				const mimeType =
					outputFormat === 'webm' ? 'video/webm' : 'video/mp4';
				const ext = outputFormat === 'webm' ? 'webm' : 'mp4';
				const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
				resolve(
					new File(
						[
							new Blob( [ e.data.buffer as ArrayBuffer ], {
								type: mimeType,
							} ),
						],
						fileName,
						{ type: mimeType }
					)
				);
			} else if ( e.data.type === 'error' ) {
				w.removeEventListener( 'message', handler );
				reject( new Error( e.data.message ) );
			}
		};
		w.addEventListener( 'message', handler );
		w.postMessage(
			{
				type: 'convert',
				coreUrl: config.coreUrl,
				inputBuffer,
				outputFormat,
				maxDimensions,
			},
			[ inputBuffer ]
		);
	} );
}

/**
 * Terminates the FFmpeg worker if it has been loaded.
 *
 * If no GIF conversion has occurred, this is a no-op since there
 * is no worker to terminate.
 */
export function terminateFFmpegWorker(): void {
	if ( worker ) {
		worker.terminate();
		worker = undefined;
	}
	if ( workerBlobUrl ) {
		URL.revokeObjectURL( workerBlobUrl );
		workerBlobUrl = undefined;
	}
}
