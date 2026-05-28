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
