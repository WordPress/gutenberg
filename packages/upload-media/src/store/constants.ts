export const STORE_NAME = 'core/upload-media';

/**
 * Default maximum number of concurrent uploads.
 */
export const DEFAULT_MAX_CONCURRENT_UPLOADS = 5;

/**
 * Default maximum number of concurrent image processing operations.
 *
 * Image processing (VIPS WASM) is significantly more memory-intensive
 * than network uploads. Each operation can consume 50-100MB+ of memory
 * for large images. A lower limit prevents out-of-memory crashes when
 * uploading many images at once.
 */
export const DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING = 2;

/**
 * Default automatic retry behavior for failed uploads.
 *
 * Four total attempts (initial + 3 retries) with exponential backoff:
 * ~1s, then ~2s, capped at 30s. The jitter factor adds randomness to
 * the delay so simultaneous failures do not retry in lockstep.
 */
export const DEFAULT_RETRY_SETTINGS = {
	maxRetryAttempts: 3,
	initialRetryDelayMs: 1000,
	maxRetryDelayMs: 30000,
	backoffMultiplier: 2,
	retryJitter: 0.1,
} as const;

/**
 * MIME types supported by client-side media processing.
 *
 * These are the image formats that can be processed using
 * WebAssembly-based vips in the browser.
 */
export const CLIENT_SIDE_SUPPORTED_MIME_TYPES: readonly string[] = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/avif',
] as const;

/**
 * HEIC/HEIF MIME types.
 *
 * These formats use the HEVC codec which has patent/licensing restrictions.
 * Instead of shipping our own decoder, the client falls back to the browser's
 * native createImageBitmap() which leverages OS/browser-licensed HEVC codecs.
 */
export const HEIC_MIME_TYPES: readonly string[] = [
	'image/heic',
	'image/heif',
] as const;

/**
 * Video MIME types eligible for client-side transcoding.
 *
 * These are container/codec combinations mediabunny can decode in the browser.
 * Includes both already-web-safe formats (which may still need downscaling or
 * bitrate reduction) and non-web-safe formats (e.g. QuickTime/MOV, Matroska,
 * AVI) that need converting for broad browser playback.
 */
export const TRANSCODABLE_VIDEO_MIME_TYPES: readonly string[] = [
	'video/mp4',
	'video/webm',
	'video/quicktime',
	'video/x-matroska',
	'video/x-msvideo',
	'video/mpeg',
	'video/3gpp',
	'video/x-m4v',
	'video/ogg',
] as const;

/**
 * Web-safe video MIME types.
 *
 * A video already in one of these containers, with a web-safe codec and within
 * the dimension/bitrate budget, can skip transcoding.
 */
export const WEB_SAFE_VIDEO_MIME_TYPES: readonly string[] = [
	'video/mp4',
	'video/webm',
] as const;

/**
 * Web-safe video codecs (mediabunny codec identifiers) that do not require
 * re-encoding for browser compatibility.
 */
export const WEB_SAFE_VIDEO_CODECS: readonly string[] = [
	'avc',
	'vp9',
	'vp8',
] as const;

/**
 * Default maximum dimension (longest edge) in pixels for transcoded videos.
 *
 * Videos whose longest edge exceeds this are downscaled. Mirrors the
 * `media-experiments` default and is filterable on the server.
 */
export const DEFAULT_VIDEO_SIZE_THRESHOLD = 1920;
