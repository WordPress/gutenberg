/**
 * External dependencies
 */
import {
	Output,
	BufferTarget,
	Mp4OutputFormat,
	WebMOutputFormat,
	VideoSampleSource,
	VideoSample,
	QUALITY_HIGH,
	canEncodeVideo,
} from 'mediabunny';

/**
 * Internal dependencies
 */
import type { HeicSequenceInput, ItemId } from './types';

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
 * A frame to encode plus its display duration (microseconds).
 */
interface SourceFrame {
	frame: VideoFrame;
	durationUs: number;
}

/**
 * Encodes a stream of decoded frames into a web-safe video (MP4 or WebM).
 *
 * Shared by the GIF and HEIC-sequence paths: each supplies an async generator
 * of frames and this drives the mediabunny encoder. The generator owns
 * decoding; this consumer owns closing every frame it receives (including
 * downscaled replacements), so neither leaks across a long sequence.
 *
 * @param id             Item ID (checked at each frame for cancellation).
 * @param frames         Async generator of frames in presentation order.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Encoded video buffer.
 */
async function encodeFramesToVideo(
	id: ItemId,
	frames: AsyncGenerator< SourceFrame >,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	if ( typeof VideoEncoder === 'undefined' ) {
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

	const source = new VideoSampleSource( { codec, bitrate: QUALITY_HIGH } );
	const target = new BufferTarget();
	const output = new Output( {
		format: isWebm ? new WebMOutputFormat() : new Mp4OutputFormat(),
		target,
	} );
	output.addVideoTrack( source );
	await output.start();

	/*
	 * Source durations are MICROSECONDS; mediabunny VideoSample
	 * timestamps/durations are SECONDS. Accumulate in seconds.
	 */
	let timestampSec = 0;
	for await ( const { frame: image, durationUs } of frames ) {
		if ( ! inProgressOperations.has( id ) ) {
			image.close();
			throw new Error( 'Operation cancelled' );
		}

		const durationSec = durationUs / 1_000_000;
		const srcW = image.displayWidth;
		const srcH = image.displayHeight;

		/*
		 * Optionally downscale, then force even dimensions: the avc/vp9
		 * encoders reject odd width/height. This runs even when no downscaling
		 * is requested, so odd-sized inputs are not rejected outright.
		 */
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
				image.close();
				throw new Error( 'Failed to create 2D canvas context' );
			}
			ctx.drawImage( image, 0, 0, targetW, targetH );
			// This replacement VideoFrame's timestamp is in microseconds.
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
			/*
			 * Close both the sample wrapper and the underlying frame;
			 * leaking either pressures memory across a long sequence.
			 */
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
}

/**
 * Runs an encode under the shared operation lock and cancellation tracking.
 *
 * The upload-media concurrency limit already serializes calls, but the lock
 * also guards direct callers (and tests) so only one encoder runs at a time.
 *
 * @param id  Item ID.
 * @param run Callback that performs the actual decode/encode work.
 * @return Encoded video buffer.
 */
async function withOperationLock(
	id: ItemId,
	run: () => Promise< ArrayBuffer >
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
		return await run();
	} finally {
		inProgressOperations.delete( id );
		releaseLock();
	}
}

/**
 * Decodes the frames of an animated GIF via the browser ImageDecoder,
 * honoring each frame's delay.
 *
 * @param id   Item ID.
 * @param data GIF file bytes.
 * @return Async generator of decoded frames.
 */
async function* decodeGifFrames(
	id: ItemId,
	data: ArrayBuffer
): AsyncGenerator< SourceFrame > {
	if ( typeof ImageDecoder === 'undefined' ) {
		throw new Error(
			`${ UNSUPPORTED_ERROR_PREFIX }: WebCodecs unavailable`
		);
	}

	const decoder = new ImageDecoder( { data, type: 'image/gif' } );
	try {
		/*
		 * Wait for the track list to be populated, not decoder.completed.
		 * For a fully-buffered ArrayBuffer source, `completed` resolves as
		 * soon as the bytes are received, which can be *before* the GIF is
		 * parsed - leaving `tracks` empty and `frameCount` at 0 (decoded as
		 * "GIF contains no decodable frames"). `tracks.ready` is the promise
		 * that resolves once track metadata is available.
		 */
		await decoder.tracks.ready;

		const track = decoder.tracks.selectedTrack;
		const frameCount = track?.frameCount ?? 0;
		if ( frameCount === 0 ) {
			throw new Error( 'GIF contains no decodable frames' );
		}

		for ( let i = 0; i < frameCount; i++ ) {
			if ( ! inProgressOperations.has( id ) ) {
				throw new Error( 'Operation cancelled' );
			}
			const { image } = await decoder.decode( { frameIndex: i } );
			yield {
				frame: image,
				durationUs: image.duration ?? GIF_DEFAULT_FRAME_DURATION_US,
			};
		}
	} finally {
		decoder.close();
	}
}

/**
 * Decodes the temporal frames of a demuxed HEIC/HEIF image sequence via the
 * WebCodecs VideoDecoder (platform HEVC codec).
 *
 * Decoding is pipelined against the consumer: at most `LOOKAHEAD` frames are
 * kept in flight so a long sequence never materializes all its full-res
 * frames at once. Frames are matched back to their source duration by
 * timestamp, which is robust to any decoder reordering.
 *
 * @param id  Item ID.
 * @param seq Demuxed sequence (codec config + samples).
 * @return Async generator of decoded frames in presentation order.
 */
async function* decodeHevcSequenceFrames(
	id: ItemId,
	seq: HeicSequenceInput
): AsyncGenerator< SourceFrame > {
	if ( typeof VideoDecoder === 'undefined' ) {
		throw new Error(
			`${ UNSUPPORTED_ERROR_PREFIX }: WebCodecs unavailable`
		);
	}

	const config: VideoDecoderConfig = {
		codec: seq.codecString,
		description: seq.description,
		codedWidth: seq.codedWidth,
		codedHeight: seq.codedHeight,
	};
	const support = await VideoDecoder.isConfigSupported( config );
	if ( ! support.supported ) {
		throw new Error(
			`${ UNSUPPORTED_ERROR_PREFIX }: HEVC decoder not supported`
		);
	}

	// Bound the number of decoded frames held in memory at once.
	const LOOKAHEAD = 8;
	const durationByTs = new Map< number, number >();
	for ( const sample of seq.samples ) {
		durationByTs.set( sample.timestampUs, sample.durationUs );
	}
	const fallbackDuration = seq.samples[ 0 ]?.durationUs ?? 0;

	const ready: VideoFrame[] = [];
	let notify: ( () => void ) | undefined;
	let decodeError: unknown;
	const wake = () => {
		if ( notify ) {
			const n = notify;
			notify = undefined;
			n();
		}
	};

	const decoder = new VideoDecoder( {
		output: ( frame ) => {
			ready.push( frame );
			wake();
		},
		error: ( e ) => {
			decodeError = e;
			wake();
		},
	} );
	decoder.configure( config );

	const total = seq.samples.length;
	let fed = 0;
	let produced = 0;
	const feed = () => {
		/*
		 * Feed while we are within the look-ahead window, or whenever the
		 * decoder has run dry (so a deep reorder can never deadlock).
		 */
		while (
			fed < total &&
			( fed - produced < LOOKAHEAD || decoder.decodeQueueSize === 0 )
		) {
			const sample = seq.samples[ fed++ ];
			decoder.decode(
				new EncodedVideoChunk( {
					type: sample.isSync ? 'key' : 'delta',
					timestamp: sample.timestampUs,
					duration: sample.durationUs,
					data: sample.data,
				} )
			);
		}
	};

	try {
		feed();
		while ( produced < total ) {
			if ( decodeError ) {
				throw decodeError;
			}
			if ( ! inProgressOperations.has( id ) ) {
				throw new Error( 'Operation cancelled' );
			}

			if ( ready.length ) {
				const frame = ready.shift() as VideoFrame;
				produced++;
				const durationUs =
					durationByTs.get( frame.timestamp ) ?? fallbackDuration;
				yield { frame, durationUs };
				feed();
				continue;
			}

			if ( fed >= total ) {
				// All input sent; flush any frames the decoder still holds.
				await decoder.flush();
				if ( ! ready.length ) {
					break;
				}
				continue;
			}

			await new Promise< void >( ( resolve ) => {
				notify = resolve;
			} );
			feed();
		}
	} finally {
		// Drop any frames left undelivered (e.g. on cancellation).
		for ( const frame of ready ) {
			frame.close();
		}
		if ( decoder.state !== 'closed' ) {
			decoder.close();
		}
	}
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
	return withOperationLock( id, async () => {
		// Read the bytes here (worker thread) rather than on the main thread.
		const data =
			gifSource instanceof ArrayBuffer
				? gifSource
				: await gifSource.arrayBuffer();

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		return encodeFramesToVideo(
			id,
			decodeGifFrames( id, data ),
			outputMimeType,
			maxDimensions
		);
	} );
}

/**
 * Converts a demuxed HEIC/HEIF image sequence to a video file (MP4 or WebM).
 *
 * The sequence is demuxed on the main thread (so the heic-parser stays within
 * the upload-media package); this worker decodes its HEVC frames and
 * re-encodes them with mediabunny, exactly like the GIF path but sourced from
 * a VideoDecoder instead of an ImageDecoder.
 *
 * @param id             Item ID.
 * @param sequence       Demuxed sequence (codec config + samples).
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Encoded video buffer.
 */
export async function convertHeicSequenceToVideo(
	id: ItemId,
	sequence: HeicSequenceInput,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	return withOperationLock( id, () =>
		encodeFramesToVideo(
			id,
			decodeHevcSequenceFrames( id, sequence ),
			outputMimeType,
			maxDimensions
		)
	);
}
