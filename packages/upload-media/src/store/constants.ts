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
