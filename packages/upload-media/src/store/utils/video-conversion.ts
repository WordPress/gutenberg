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
 * Message prefix used by @wordpress/video-conversion for GIFs skipped
 * because they exceed the total-pixel budget. This MUST mirror the
 * package's exported `SIZE_LIMIT_ERROR_PREFIX`; it is duplicated here for
 * the same bundle-size reason as UNSUPPORTED_ERROR_PREFIX above.
 */
const SIZE_LIMIT_ERROR_PREFIX = `${ UNSUPPORTED_ERROR_PREFIX }: GIF exceeds maximum conversion size`;

/**
 * Message prefix for conversions abandoned by the timeout in
 * `convertGifToVideo` below. Thrown and detected on the main thread, but
 * kept as a message-prefix contract for consistency with the other
 * conversion outcomes.
 */
const CONVERSION_TIMEOUT_ERROR_PREFIX = 'GIF to video conversion timed out';

/**
 * Default time in milliseconds a GIF-to-video conversion may run before it
 * is abandoned and only the original GIF is kept.
 *
 * Beyond ~30 seconds the companion video stops being worth the CPU churn:
 */
export const DEFAULT_CONVERSION_TIMEOUT = 30_000;

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
 * Whether an error from GIF-to-video conversion means the GIF was skipped
 * for exceeding the total-pixel budget. Such errors are also "unsupported"
 * (graceful) outcomes; this narrower check exists so callers can log why
 * no companion video was produced.
 *
 * @param error Error thrown by `convertGifToVideo`.
 * @return Whether the error is a size-limit skip.
 */
export function isSizeLimitConversionError( error: unknown ): boolean {
	return (
		error instanceof Error &&
		error.message.startsWith( SIZE_LIMIT_ERROR_PREFIX )
	);
}

/**
 * Whether an error from GIF-to-video conversion means the conversion was
 * abandoned because it exceeded the allowed time.
 *
 * @param error Error thrown by `convertGifToVideo`.
 * @return Whether the error is a conversion timeout.
 */
export function isConversionTimeoutError( error: unknown ): boolean {
	return (
		error instanceof Error &&
		error.message.startsWith( CONVERSION_TIMEOUT_ERROR_PREFIX )
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

interface ConvertGifToVideoOptions {
	/** Maximum dimension for downscaling. */
	maxDimensions?: number;
	/**
	 * Time in milliseconds before the conversion is abandoned and only the
	 * original GIF is kept. `0` disables the timeout.
	 */
	timeout?: number;
	/**
	 * Budget for total decoded pixels (width × height × frame count) beyond
	 * which the conversion is not attempted. Defaults to the
	 * `@wordpress/video-conversion` package default; `0` disables the check.
	 */
	maxTotalPixels?: number;
}

/**
 * Converts an animated GIF to a video file using the video conversion worker.
 *
 * The timeout only covers the conversion itself, not the initial lazy load
 * of the worker module (which has its own retry handling). On timeout the
 * worker-side operation is cancelled so it stops churning, and the returned
 * promise rejects with an error recognized by `isConversionTimeoutError`.
 *
 * @param id                     Queue item ID.
 * @param file                   GIF file object.
 * @param outputMimeType         Output MIME type ('video/mp4' or 'video/webm').
 * @param options                Conversion options.
 * @param options.maxDimensions  Maximum dimension for downscaling.
 * @param options.timeout        Milliseconds before the conversion is
 *                               abandoned. `0` disables the timeout.
 * @param options.maxTotalPixels Budget for total decoded pixels
 *                               (width × height × frame count). `0` disables.
 * @return Converted video file.
 */
export async function convertGifToVideo(
	id: QueueItemId,
	file: File,
	outputMimeType: string,
	{
		maxDimensions,
		timeout = DEFAULT_CONVERSION_TIMEOUT,
		maxTotalPixels,
	}: ConvertGifToVideoOptions = {}
) {
	const mod = await loadVideoConversionModule();
	// Pass the File straight through: the worker reads its bytes once, off
	// the main thread, instead of materializing an ArrayBuffer here.
	const conversion = mod.convertGifToVideo(
		id,
		file,
		outputMimeType,
		maxDimensions,
		maxTotalPixels
	);

	let buffer: ArrayBuffer;
	if ( timeout > 0 ) {
		let timer: ReturnType< typeof setTimeout > | undefined;
		try {
			buffer = await Promise.race( [
				conversion,
				new Promise< never >( ( _, reject ) => {
					timer = setTimeout( () => {
						reject(
							new Error(
								`${ CONVERSION_TIMEOUT_ERROR_PREFIX } after ${ timeout }ms`
							)
						);
					}, timeout );
				} ),
			] );
		} catch ( error ) {
			if ( isConversionTimeoutError( error ) ) {
				/*
				 * The race already settled; swallow the orphaned conversion
				 * promise's eventual rejection ("Operation cancelled") so it
				 * is not reported as unhandled.
				 */
				conversion.catch( () => {} );
				// Stop the worker loop at its next async boundary.
				mod.cancelGifToVideoOperations( id ).catch( () => {} );
			}
			throw error;
		} finally {
			clearTimeout( timer );
		}
	} else {
		buffer = await conversion;
	}

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
