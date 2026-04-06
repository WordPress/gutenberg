/**
 * Internal dependencies
 */
import type { ItemId } from './types';

/**
 * FFmpeg WASM configuration provided by the wp-ffmpeg-wasm plugin.
 *
 * The plugin sets window.__ffmpegWasmConfig on editor pages via
 * wp_add_inline_script, or it can be fetched from the plugin's
 * REST endpoint after mid-session installation.
 */
export interface FFmpegWasmConfig {
	/** URL to the Emscripten JS glue file (ffmpeg-core.js). */
	coreUrl: string;
	/** URL to the FFmpeg WASM binary (ffmpeg-core.wasm). */
	wasmUrl: string;
}

interface FFmpegCore {
	FS: {
		writeFile: ( path: string, data: Uint8Array ) => void;
		readFile: ( path: string ) => Uint8Array;
		unlink: ( path: string ) => void;
	};
	callMain: ( args: string[] ) => void;
	ret: number;
	reset: () => void;
	exec: ( ...args: string[] ) => void;
	setTimeout: ( timeout: number ) => void;
	setLogger: (
		callback: ( data: { type: string; message: string } ) => void
	) => void;
	setProgress: (
		callback: ( data: { progress: number; time: number } ) => void
	) => void;
}

let ffmpegPromise: Promise< FFmpegCore > | undefined;

/**
 * Instantiates and returns the FFmpeg core module.
 *
 * Loads the Emscripten module and WASM binary from URLs provided
 * by the wp-ffmpeg-wasm canonical plugin. Reuses any existing instance.
 *
 * @param config WASM configuration with URLs to core JS and WASM files.
 */
async function getFFmpegCore(
	config: FFmpegWasmConfig
): Promise< FFmpegCore > {
	if ( ffmpegPromise ) {
		return await ffmpegPromise;
	}

	ffmpegPromise = ( async () => {
		// Fetch the Emscripten JS glue from the plugin's assets directory.
		const response = await fetch( config.coreUrl );
		const coreJsText = await response.text();

		// Create the Emscripten module factory from the fetched JS.
		// The UMD build assigns createFFmpegCore to the global scope.
		const blob = new Blob( [ coreJsText ], {
			type: 'application/javascript',
		} );
		const blobUrl = URL.createObjectURL( blob );

		// Use importScripts in worker context to load the module factory.

		(
			self as unknown as { importScripts: ( url: string ) => void }
		 ).importScripts( blobUrl );
		URL.revokeObjectURL( blobUrl );

		// The Emscripten module factory is now on the global scope.
		const createFFmpegCore = (
			self as unknown as Record< string, unknown >
		 ).createFFmpegCore as (
			opts: Record< string, unknown >
		) => Promise< FFmpegCore >;

		if ( ! createFFmpegCore ) {
			throw new Error( 'Failed to load FFmpeg core module' );
		}

		return createFFmpegCore( {
			locateFile: ( fileName: string ) => {
				if ( fileName.endsWith( '.wasm' ) ) {
					return config.wasmUrl;
				}
				return fileName;
			},
			// Suppress Emscripten console output.
			print: () => {},
			printErr: () => {},
		} );
	} )();

	// Clear cached promise on failure to allow retry.
	ffmpegPromise.catch( () => {
		ffmpegPromise = undefined;
	} );

	return await ffmpegPromise;
}

/**
 * Holds a list of ongoing operations for a given ID.
 *
 * This way, operations can be cancelled mid-progress.
 */
const inProgressOperations = new Set< ItemId >();

/**
 * Cancels all ongoing operations for a given item ID.
 *
 * Note: cancellation only takes effect at async boundaries (e.g., while
 * waiting for the FFmpeg core to load or for the operation lock). Once
 * core.exec() starts, it runs synchronously and cannot be interrupted.
 *
 * @param id Item ID.
 * @return Whether any operation was cancelled.
 */
export async function cancelOperations( id: ItemId ) {
	return inProgressOperations.delete( id );
}

/**
 * Pads a dimension to the nearest even number.
 *
 * FFmpeg requires even dimensions for most codecs (H.264, VP9).
 *
 * @param value Dimension value.
 * @return Even dimension value.
 */
function padToEven( value: number ): number {
	return value % 2 === 0 ? value : value + 1;
}

/**
 * Serialization lock for FFmpeg operations.
 *
 * The FFmpeg core shares a single Emscripten module instance with shared
 * MEMFS. Concurrent operations would corrupt each other's files and state.
 * This lock serializes access so only one operation runs at a time.
 */
let operationLock: Promise< void > = Promise.resolve();

/**
 * Converts an animated GIF to a video file (MP4 or WebM).
 *
 * @param id             Item ID.
 * @param buffer         GIF file buffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param config         WASM configuration with URLs from the wp-ffmpeg-wasm plugin.
 * @param maxDimensions  Optional maximum dimensions for scaling.
 * @return Video file buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	buffer: ArrayBuffer,
	outputMimeType: string,
	config: FFmpegWasmConfig,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	inProgressOperations.add( id );

	// Serialize access to the shared FFmpeg core instance.
	const previousLock = operationLock;
	let releaseLock: () => void;
	operationLock = new Promise< void >( ( resolve ) => {
		releaseLock = resolve;
	} );

	try {
		await previousLock;

		// Check if cancelled while waiting for the lock.
		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		const core = await getFFmpegCore( config );

		// Check if cancelled while waiting for core initialization.
		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		// Use unique filenames per operation to avoid conflicts.
		const inputFileName = `input_${ id }.gif`;
		const isWebm = outputMimeType === 'video/webm';
		const outputExt = isWebm ? 'webm' : 'mp4';
		const outputFileName = `output_${ id }.${ outputExt }`;

		// Write input file to FFmpeg's in-memory filesystem.
		core.FS.writeFile( inputFileName, new Uint8Array( buffer ) );

		// Build FFmpeg arguments.
		const args: string[] = [ '-nostdin', '-y', '-i', inputFileName ];

		// Video codec selection.
		if ( isWebm ) {
			args.push( '-c:v', 'libvpx-vp9' );
			// VP9 quality settings.
			args.push( '-crf', '31', '-b:v', '0' );
		} else {
			args.push( '-c:v', 'libx264' );
			// H.264 encoding preset — 'fast' balances speed and quality.
			// 'veryfast' has been reported to cause crashes in WASM builds.
			args.push( '-preset', 'fast' );
		}

		// Common settings.
		// Cap framerate at 24fps to reduce file size.
		args.push( '-r', '24' );
		// Use yuv420p for maximum compatibility.
		args.push( '-pix_fmt', 'yuv420p' );

		// Scale filter: pad to even dimensions (required by most codecs)
		// and optionally scale down if exceeding maxDimensions.
		if ( maxDimensions ) {
			args.push(
				'-vf',
				`scale='min(${ padToEven(
					maxDimensions
				) },trunc(iw/2)*2)':'min(${ padToEven(
					maxDimensions
				) },trunc(ih/2)*2)':flags=lanczos`
			);
		} else {
			// Just ensure even dimensions.
			args.push( '-vf', "scale='trunc(iw/2)*2':'trunc(ih/2)*2'" );
		}

		// MP4-specific: move metadata to the beginning for streaming.
		if ( ! isWebm ) {
			args.push( '-movflags', '+faststart' );
		}

		// Remove audio (GIFs don't have audio).
		args.push( '-an' );

		args.push( outputFileName );

		// Run FFmpeg and read output, ensuring cleanup always happens.
		core.setTimeout( -1 );
		try {
			core.exec( ...args );

			// Read output file.
			const output = core.FS.readFile( outputFileName );

			if ( ! output || output.length === 0 ) {
				throw new Error( 'FFmpeg produced empty output' );
			}

			// Slice the buffer to extract only the relevant bytes.
			// Uint8Array.buffer may include data outside the view's range.
			return ( output.buffer as ArrayBuffer ).slice(
				output.byteOffset,
				output.byteOffset + output.byteLength
			);
		} finally {
			// Always clean up temporary files and reset core state,
			// even if exec() or readFile() throws.
			try {
				core.FS.unlink( inputFileName );
				core.FS.unlink( outputFileName );
			} catch {
				// Ignore cleanup errors.
			}
			core.reset();
		}
	} finally {
		inProgressOperations.delete( id );
		releaseLock!();
	}
}

// Re-export with ffmpeg prefix for worker module compatibility.
export {
	convertGifToVideo as ffmpegConvertGifToVideo,
	cancelOperations as ffmpegCancelOperations,
};
