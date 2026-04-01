/**
 * External dependencies
 */
// @ts-expect-error - Default export is the Emscripten module factory.
import createFFmpegCore from '@ffmpeg/core';

// @ts-expect-error - WASM file is inlined as a base64 data URL at build time.
import FFmpegCoreWasm from '@ffmpeg/core/wasm';

/**
 * Internal dependencies
 */
import type { ItemId } from './types';

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
 * Reuses any existing instance.
 */
async function getFFmpegCore(): Promise< FFmpegCore > {
	if ( ffmpegPromise ) {
		return await ffmpegPromise;
	}

	const promise = createFFmpegCore( {
		locateFile: ( fileName: string ) => {
			// WASM file is inlined as a base64 data URL at build time,
			// eliminating the need for separate file downloads.
			if ( fileName.endsWith( '.wasm' ) ) {
				return FFmpegCoreWasm;
			}
			return fileName;
		},
		// Suppress Emscripten console output.
		print: () => {},
		printErr: () => {},
	} ) as Promise< FFmpegCore >;

	ffmpegPromise = promise;

	return await promise;
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
 * @param maxDimensions  Optional maximum dimensions for scaling.
 * @return Video file buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	buffer: ArrayBuffer,
	outputMimeType: string,
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

		const core = await getFFmpegCore();

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

		// Run FFmpeg.
		core.setTimeout( -1 );
		core.exec( ...args );

		// Read output file.
		const output = core.FS.readFile( outputFileName );

		if ( ! output || output.length === 0 ) {
			throw new Error( 'FFmpeg produced empty output' );
		}

		// Slice the buffer to extract only the relevant bytes.
		// Uint8Array.buffer may include data outside the view's range.
		const result = output.buffer.slice(
			output.byteOffset,
			output.byteOffset + output.byteLength
		) as ArrayBuffer;

		// Clean up temporary files.
		try {
			core.FS.unlink( inputFileName );
			core.FS.unlink( outputFileName );
		} catch {
			// Ignore cleanup errors.
		}

		core.reset();

		return result;
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
