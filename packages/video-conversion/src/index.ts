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
	type Quality,
	type VideoCodec,
	type ConversionAudioOptions,
	type ConversionVideoOptions,
} from 'mediabunny';
import type { ItemId, VideoMetadata, TranscodeVideoOptions } from './types.ts';

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
 * Message prefix for GIFs skipped because they exceed the total-pixel budget.
 *
 * Starts with UNSUPPORTED_ERROR_PREFIX so existing consumers treat the skip
 * as a graceful fallback (keep the uploaded GIF, no companion video); the
 * longer prefix lets consumers distinguish it, e.g. to log a warning. Like
 * UNSUPPORTED_ERROR_PREFIX, the contract is the message prefix because only
 * the message string survives the worker boundary.
 */
export const SIZE_LIMIT_ERROR_PREFIX = `${ UNSUPPORTED_ERROR_PREFIX }: GIF exceeds maximum conversion size`;

/**
 * Default budget for total decoded pixels (width × height × frame count)
 * beyond which conversion is not attempted.
 *
 * Conversion cost is roughly proportional to the total number of decoded
 * pixels. 300 megapixels approximates what a mid-range machine converts
 * within the ~30s the caller is willing to wait (e.g. a 1920x1080 GIF at
 * ~145 frames); anything larger would likely be abandoned anyway, so it is
 * cheaper to not start. Pass `0` to disable the check.
 */
export const DEFAULT_MAX_TOTAL_PIXELS = 300_000_000;

/**
 * Hardware acceleration hints to try, in order of preference.
 *
 * A hardware encoder is much faster where one exists, but `'prefer-hardware'`
 * is a hard requirement to WebCodecs, not a hint: the browser rejects the
 * configuration outright when no hardware encoder is available, which is the
 * norm on headless browsers, VMs and CI runners. Falling back to
 * `'no-preference'` lets the browser reach its software encoder instead.
 */
const HARDWARE_ACCELERATION_PREFERENCES = [
	'prefer-hardware',
	'no-preference',
] as const;

type HardwareAccelerationPreference =
	( typeof HARDWARE_ACCELERATION_PREFERENCES )[ number ];

/**
 * Picks the first hardware acceleration hint the browser will actually encode
 * with, for the given codec and output parameters.
 *
 * Support is parameter-specific, so the probe has to use the real output
 * dimensions and bitrate: a configuration the browser accepts at 1280x720 can
 * be rejected at 160x120.
 *
 * @param codec   Video codec.
 * @param bitrate Output bitrate, or a subjective quality.
 * @param width   Output width in pixels, if known.
 * @param height  Output height in pixels, if known.
 * @return The first supported hint, or `null` when none of them are supported.
 */
async function selectHardwareAcceleration(
	codec: VideoCodec,
	bitrate: number | Quality,
	width?: number,
	height?: number
): Promise< HardwareAccelerationPreference | null > {
	for ( const hardwareAcceleration of HARDWARE_ACCELERATION_PREFERENCES ) {
		// Sequential on purpose: the first supported hint wins, so probing the
		// rest would be wasted work.
		const supported = await canEncodeVideo( codec, {
			width,
			height,
			bitrate,
			hardwareAcceleration,
		} );
		if ( supported ) {
			return hardwareAcceleration;
		}
	}
	return null;
}

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
 * @param maxTotalPixels Optional budget for total decoded pixels
 *                       (width × height × frame count) beyond which the
 *                       conversion is rejected with SIZE_LIMIT_ERROR_PREFIX.
 *                       Defaults to DEFAULT_MAX_TOTAL_PIXELS; `0` disables.
 * @return Encoded video buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	gifSource: ArrayBuffer | Blob,
	outputMimeType: string,
	maxDimensions?: number,
	maxTotalPixels?: number
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

			/*
			 * Enforce the total-pixel budget before any encoding work: an
			 * over-budget GIF would churn the CPU for minutes only to be
			 * abandoned. Track metadata does not expose dimensions, so decode
			 * the first frame (cheap) to learn them.
			 */
			const pixelBudget = maxTotalPixels ?? DEFAULT_MAX_TOTAL_PIXELS;
			if ( pixelBudget > 0 ) {
				const { image: probe } = await decoder.decode( {
					frameIndex: 0,
				} );
				const probeWidth = probe.displayWidth;
				const probeHeight = probe.displayHeight;
				probe.close();

				if ( ! inProgressOperations.has( id ) ) {
					throw new Error( 'Operation cancelled' );
				}

				const totalPixels = probeWidth * probeHeight * frameCount;
				if ( totalPixels > pixelBudget ) {
					throw new Error(
						`${ SIZE_LIMIT_ERROR_PREFIX } (${ probeWidth }x${ probeHeight } x ${ frameCount } frames = ${ totalPixels } pixels; limit is ${ pixelBudget })`
					);
				}
			}

			const source = new VideoSampleSource( {
				codec,
				bitrate: QUALITY_HIGH,
				/*
				 * A sparser key frame cadence than mediabunny's 2s default
				 * roughly halves the output size for long GIFs at no
				 * encode-time or quality cost. These looping, autoplaying
				 * GIF replacements don't need fine seek granularity.
				 */
				keyFrameInterval: 10,
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
 * web-safe. The bitrate is best-effort: if it cannot be computed it is
 * returned as 0, and the format/dimension checks still suffice.
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
	try {
		/*
		 * Sample a subset of packets for the bitrate estimate to keep this
		 * fast; an exact figure is not needed for the eligibility decision.
		 * Nothing here walks the whole file: a full duration scan of a
		 * container without an index (e.g. a MediaRecorder WebM) would read
		 * every byte before the transcode decision is even made.
		 */
		const stats = await track.computePacketStats( 100 );
		bitrate = stats.averageBitrate;
	} catch {
		// The bitrate is best-effort; leave it at 0.
	}

	return { codec, width, height, bitrate };
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
		/*
		 * Name the audio codec browsers play in each container. Left
		 * unspecified, mediabunny copies any audio codec the container can
		 * hold (e.g. Vorbis in MP4), which browsers then cannot play.
		 */
		const audioOptions: ConversionAudioOptions = {
			codec: isWebm ? 'opus' : 'aac',
		};

		const blob = source instanceof Blob ? source : new Blob( [ source ] );
		const input = new Input( {
			formats: ALL_FORMATS,
			source: new BlobSource( blob ),
		} );

		const bitrate = options.bitrate ?? QUALITY_HIGH;
		const videoOptions: ConversionVideoOptions = { codec, bitrate };
		if ( options.frameRate ) {
			videoOptions.frameRate = options.frameRate;
		}

		/*
		 * Read the source dimensions up front: they are needed both to cap the
		 * output size and to probe encoder support at the real output size.
		 */
		const track = await input.getPrimaryVideoTrack();
		let outputWidth: number | undefined;
		let outputHeight: number | undefined;
		if ( track ) {
			const [ srcW, srcH ] = await Promise.all( [
				track.getDisplayWidth(),
				track.getDisplayHeight(),
			] );
			outputWidth = srcW;
			outputHeight = srcH;

			/*
			 * Cap the longest edge while preserving aspect ratio: set only the
			 * dominant dimension and let mediabunny deduce the other.
			 */
			const max = options.maxDimensions;
			if ( max && srcW >= srcH && srcW > max ) {
				videoOptions.width = max;
				outputWidth = max;
				outputHeight = Math.round( ( srcH * max ) / srcW );
			} else if ( max && srcH > srcW && srcH > max ) {
				videoOptions.height = max;
				outputHeight = max;
				outputWidth = Math.round( ( srcW * max ) / srcH );
			}
		}

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		/*
		 * Probe before encoding rather than letting Conversion throw: a
		 * hardware encoder is not always available (headless browsers, VMs, CI
		 * runners), and `'prefer-hardware'` is rejected outright when it is
		 * missing. Fall back to the browser's own choice, and only give up
		 * once no hint works.
		 */
		const hardwareAcceleration = await selectHardwareAcceleration(
			codec,
			bitrate,
			outputWidth,
			outputHeight
		);
		if ( ! hardwareAcceleration ) {
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: encoder codec not supported`
			);
		}
		videoOptions.hardwareAcceleration = hardwareAcceleration;

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		const output = new Output( {
			format: isWebm
				? new WebMOutputFormat()
				: new Mp4OutputFormat( { fastStart: 'in-memory' } ),
			target: new BufferTarget(),
		} );

		const conversion = await Conversion.init( {
			input,
			output,
			video: videoOptions,
			audio: audioOptions,
		} );

		if ( ! inProgressOperations.has( id ) ) {
			await conversion.cancel();
			throw new Error( 'Operation cancelled' );
		}

		/*
		 * mediabunny drops a track it cannot decode or re-encode (say AC-3 or
		 * DTS audio) and still reports the conversion as valid, because the
		 * container needs no audio. A silent companion would then play by
		 * default in place of a perfectly good original, so treat lost audio
		 * as unsupported and let the caller keep the original.
		 */
		const lostAudio = conversion.discardedTracks.some( ( discarded ) =>
			discarded.track.isAudioTrack()
		);
		if ( ! conversion.isValid || lostAudio ) {
			await conversion.cancel();
			throw new Error(
				`${ UNSUPPORTED_ERROR_PREFIX }: ${
					lostAudio
						? 'audio track cannot be converted'
						: 'conversion is not valid'
				}`
			);
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
