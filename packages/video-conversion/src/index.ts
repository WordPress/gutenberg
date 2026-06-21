/**
 * External dependencies
 */
import {
	Input,
	Output,
	Conversion,
	BlobSource,
	BufferTarget,
	Mp4OutputFormat,
	WebMOutputFormat,
	VideoSampleSource,
	VideoSample,
	QUALITY_HIGH,
	canEncodeVideo,
	ALL_FORMATS,
	type VideoCodec,
	type ConversionVideoOptions,
} from 'mediabunny';

/**
 * Internal dependencies
 */
import type { ItemId, VideoMetadata, TranscodeVideoOptions } from './types';

/**
 * Tracks in-progress operations so they can be cancelled at async boundaries.
 */
const inProgressOperations = new Set< ItemId >();

/**
 * Fallback per-frame duration when ImageDecoder reports none.
 * GIF spec default 10fps = 100ms (in microseconds).
 */
const GIF_DEFAULT_FRAME_DURATION_US = 100_000;

/**
 * Message prefix for "unsupported but graceful" outcomes (no WebCodecs,
 * unsupported codec). Consumers detect this prefix and fall back to uploading
 * the original GIF instead of surfacing a hard error.
 *
 * The contract is the message *prefix*, not the Error type: the worker RPC
 * layer (comctx) serializes a thrown error to its `message` string only - the
 * Error subclass, `name`, and `stack` do not survive the worker boundary.
 */
export const UNSUPPORTED_ERROR_PREFIX = 'Unsupported';

/**
 * Serializes encoder access. The upload-media concurrency limit already caps
 * this at 1, but the lock guards direct callers too.
 */
let operationLock: Promise< void > = Promise.resolve();

/**
 * Cancels all ongoing operations for a given item ID.
 *
 * Cancellation takes effect at async boundaries (waiting for the lock,
 * encoder-support check, decoder completion, between frames).
 *
 * @param id Item ID.
 * @return Whether an operation was cancelled.
 */
export async function cancelOperations( id: ItemId ): Promise< boolean > {
	return inProgressOperations.delete( id );
}

/**
 * Pads a dimension up to the nearest even number (encoder requirement).
 *
 * @param value Dimension value.
 * @return Even dimension value.
 */
function padToEven( value: number ): number {
	return value % 2 === 0 ? value : value + 1;
}

/**
 * Converts an animated GIF to a video file (MP4 or WebM).
 *
 * Decodes GIF frames via the browser ImageDecoder (honoring per-frame
 * delays) and re-encodes them with mediabunny / WebCodecs.
 *
 * Accepts the GIF as a Blob so the bytes are read once, here in the worker,
 * instead of being materialized on the main thread and transferred. An
 * ArrayBuffer is still accepted for direct callers and tests.
 *
 * @param id             Item ID.
 * @param gifSource      GIF file as a Blob/File or ArrayBuffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Encoded video buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	gifSource: ArrayBuffer | Blob,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	inProgressOperations.add( id );

	const previousLock = operationLock;
	let releaseLock: () => void = () => {};
	operationLock = new Promise< void >( ( resolve ) => {
		releaseLock = resolve;
	} );

	try {
		await previousLock;

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		if (
			typeof ImageDecoder === 'undefined' ||
			typeof VideoEncoder === 'undefined'
		) {
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: WebCodecs unavailable`
			);
		}

		const isWebm = outputMimeType === 'video/webm';
		const codec = isWebm ? 'vp9' : 'avc';

		if ( ! ( await canEncodeVideo( codec ) ) ) {
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: encoder codec not supported`
			);
		}

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		// Read the bytes here (worker thread) rather than on the main thread.
		const data =
			gifSource instanceof ArrayBuffer
				? gifSource
				: await gifSource.arrayBuffer();

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		const decoder = new ImageDecoder( {
			data,
			type: 'image/gif',
		} );

		try {
			// Wait for the track list to be populated, not decoder.completed.
			// For a fully-buffered ArrayBuffer source, `completed` resolves as
			// soon as the bytes are received, which can be *before* the GIF is
			// parsed - leaving `tracks` empty and `frameCount` at 0 (decoded as
			// "GIF contains no decodable frames"). `tracks.ready` is the
			// promise that resolves once track metadata is available.
			await decoder.tracks.ready;

			if ( ! inProgressOperations.has( id ) ) {
				throw new Error( 'Operation cancelled' );
			}

			const track = decoder.tracks.selectedTrack;
			const frameCount = track?.frameCount ?? 0;
			if ( frameCount === 0 ) {
				throw new Error( 'GIF contains no decodable frames' );
			}

			const source = new VideoSampleSource( {
				codec,
				bitrate: QUALITY_HIGH,
			} );
			const target = new BufferTarget();
			const output = new Output( {
				format: isWebm ? new WebMOutputFormat() : new Mp4OutputFormat(),
				target,
			} );
			output.addVideoTrack( source );
			await output.start();

			// ImageDecoder durations are MICROSECONDS; mediabunny VideoSample
			// timestamps/durations are SECONDS. Accumulate in seconds.
			let timestampSec = 0;
			for ( let i = 0; i < frameCount; i++ ) {
				if ( ! inProgressOperations.has( id ) ) {
					throw new Error( 'Operation cancelled' );
				}

				const { image } = await decoder.decode( { frameIndex: i } );
				const durationUs =
					image.duration ?? GIF_DEFAULT_FRAME_DURATION_US;
				const durationSec = durationUs / 1_000_000;

				const srcW = image.displayWidth;
				const srcH = image.displayHeight;

				// Optionally downscale, then force even dimensions: the avc/vp9
				// encoders reject odd width/height (e.g. a 600x385 GIF). This
				// runs even when no downscaling is requested, so odd-sized GIFs
				// are not rejected outright.
				let targetW = srcW;
				let targetH = srcH;
				if (
					maxDimensions &&
					( srcW > maxDimensions || srcH > maxDimensions )
				) {
					const scale = Math.min(
						maxDimensions / srcW,
						maxDimensions / srcH
					);
					targetW = Math.round( srcW * scale );
					targetH = Math.round( srcH * scale );
				}
				targetW = padToEven( targetW );
				targetH = padToEven( targetH );

				let frameForEncode: VideoFrame = image;
				if ( targetW !== srcW || targetH !== srcH ) {
					const canvas = new OffscreenCanvas( targetW, targetH );
					const ctx = canvas.getContext( '2d' );
					if ( ! ctx ) {
						throw new Error( 'Failed to create 2D canvas context' );
					}
					ctx.drawImage( image, 0, 0, targetW, targetH );
					// This replacement VideoFrame's timestamp is in
					// microseconds.
					frameForEncode = new VideoFrame( canvas, {
						timestamp: Math.round( timestampSec * 1_000_000 ),
						duration: durationUs,
					} );
					image.close();
				}

				const sample = new VideoSample( frameForEncode, {
					timestamp: timestampSec,
					duration: durationSec,
				} );
				try {
					await source.add( sample );
				} finally {
					// Close both the sample wrapper and the underlying frame;
					// leaking either pressures memory across a long GIF.
					sample.close();
					frameForEncode.close();
				}
				timestampSec += durationSec;
			}

			await output.finalize();

			const out = target.buffer;
			if ( ! out || out.byteLength === 0 ) {
				throw new Error( 'Encoder produced empty output' );
			}
			return out;
		} finally {
			decoder.close();
		}
	} finally {
		inProgressOperations.delete( id );
		releaseLock();
	}
}

/**
 * Reads metadata from a video file's primary video track.
 *
 * Only the container headers are read (not the full media), so this is cheap
 * enough to run on every upload to decide whether the video is already
 * web-safe. Bitrate and duration are best-effort: if they cannot be computed
 * they are returned as 0, and the format/dimension checks still suffice.
 *
 * Accepts the video as a Blob/File so the bytes are read here in the worker.
 * An ArrayBuffer is still accepted for direct callers and tests.
 *
 * @param source Video file as a Blob/File or ArrayBuffer.
 * @return The primary video track's metadata.
 */
export async function getVideoMetadata(
	source: ArrayBuffer | Blob
): Promise< VideoMetadata > {
	const blob = source instanceof Blob ? source : new Blob( [ source ] );
	const input = new Input( {
		formats: ALL_FORMATS,
		source: new BlobSource( blob ),
	} );

	const track = await input.getPrimaryVideoTrack();
	if ( ! track ) {
		throw new Error( 'No video track found' );
	}

	const [ codec, width, height ] = await Promise.all( [
		track.getCodec(),
		track.getDisplayWidth(),
		track.getDisplayHeight(),
	] );

	let bitrate = 0;
	let duration = 0;
	try {
		/*
		 * Sample a subset of packets for the bitrate estimate to keep this
		 * fast; an exact figure is not needed for the eligibility decision.
		 */
		const stats = await track.computePacketStats( 100 );
		bitrate = stats.averageBitrate;
		duration = await track.computeDuration();
	} catch {
		// Bitrate/duration are best-effort; leave them at 0.
	}

	return { codec, width, height, bitrate, duration };
}

/**
 * Transcodes a video to a web-safe format (MP4/H.264 or WebM/VP9).
 *
 * Re-encodes the input with mediabunny / WebCodecs, optionally downscaling to
 * a maximum dimension and capping the frame rate. The MP4 output uses Fast
 * Start (moov atom at the front) for progressive playback.
 *
 * Accepts the video as a Blob/File so the bytes are read once, here in the
 * worker, instead of being materialized on the main thread and transferred.
 * An ArrayBuffer is still accepted for direct callers and tests.
 *
 * @param id             Item ID.
 * @param source         Video file as a Blob/File or ArrayBuffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param options        Transcoding options (max dimension, frame rate, bitrate).
 * @return Encoded video buffer.
 */
export async function transcodeVideo(
	id: ItemId,
	source: ArrayBuffer | Blob,
	outputMimeType: string,
	options: TranscodeVideoOptions = {}
): Promise< ArrayBuffer > {
	inProgressOperations.add( id );

	const previousLock = operationLock;
	let releaseLock: () => void = () => {};
	operationLock = new Promise< void >( ( resolve ) => {
		releaseLock = resolve;
	} );

	try {
		await previousLock;

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		if ( typeof VideoEncoder === 'undefined' ) {
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: WebCodecs unavailable`
			);
		}

		const isWebm = outputMimeType === 'video/webm';
		const codec: VideoCodec = isWebm ? 'vp9' : 'avc';

		if ( ! ( await canEncodeVideo( codec ) ) ) {
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: encoder codec not supported`
			);
		}

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		const blob = source instanceof Blob ? source : new Blob( [ source ] );
		const input = new Input( {
			formats: ALL_FORMATS,
			source: new BlobSource( blob ),
		} );
		const output = new Output( {
			format: isWebm
				? new WebMOutputFormat()
				: new Mp4OutputFormat( { fastStart: 'in-memory' } ),
			target: new BufferTarget(),
		} );

		const videoOptions: ConversionVideoOptions = {
			codec,
			bitrate: options.bitrate ?? QUALITY_HIGH,
			hardwareAcceleration: 'prefer-hardware',
		};
		if ( options.frameRate ) {
			videoOptions.frameRate = options.frameRate;
		}

		/*
		 * Cap the longest edge while preserving aspect ratio: set only the
		 * dominant dimension and let mediabunny deduce the other.
		 */
		if ( options.maxDimensions ) {
			const track = await input.getPrimaryVideoTrack();
			if ( track ) {
				const [ srcW, srcH ] = await Promise.all( [
					track.getDisplayWidth(),
					track.getDisplayHeight(),
				] );
				if ( srcW >= srcH && srcW > options.maxDimensions ) {
					videoOptions.width = options.maxDimensions;
				} else if ( srcH > srcW && srcH > options.maxDimensions ) {
					videoOptions.height = options.maxDimensions;
				}
			}
		}

		const conversion = await Conversion.init( {
			input,
			output,
			video: videoOptions,
		} );

		if ( ! inProgressOperations.has( id ) ) {
			await conversion.cancel();
			throw new Error( 'Operation cancelled' );
		}

		await conversion.execute();

		const out = output.target.buffer;
		if ( ! out || out.byteLength === 0 ) {
			throw new Error( 'Encoder produced empty output' );
		}
		return out;
	} finally {
		inProgressOperations.delete( id );
		releaseLock();
	}
}
