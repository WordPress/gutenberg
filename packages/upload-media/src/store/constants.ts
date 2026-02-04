export const STORE_NAME = 'core/upload-media';

/**
 * Default maximum number of concurrent uploads.
 */
export const DEFAULT_MAX_CONCURRENT_UPLOADS = 5;

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
