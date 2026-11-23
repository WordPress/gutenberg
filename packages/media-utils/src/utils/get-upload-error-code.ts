/**
 * REST error codes the server uses when a multisite network's storage limit
 * rejects a file: not enough space left, or the quota already used up.
 */
const STORAGE_LIMIT_REST_CODES = [
	'rest_upload_limited_space',
	'rest_upload_user_quota_exceeded',
];

/**
 * Error code for a file the site's storage limit rejected.
 *
 * Matches `ErrorCode.STORAGE_LIMIT_REACHED` in `@wordpress/upload-media`,
 * which reads it to tell this failure apart from any other.
 */
export const STORAGE_LIMIT_REACHED = 'STORAGE_LIMIT_REACHED';

/**
 * Picks the upload error code for a failed upload request.
 *
 * @param error The value the upload request rejected with.
 * @return `STORAGE_LIMIT_REACHED` for a storage limit rejection, `GENERAL` otherwise.
 */
export function getUploadErrorCode( error: unknown ): string {
	const { code } = ( error ?? {} ) as { code?: unknown };

	return typeof code === 'string' && STORAGE_LIMIT_REST_CODES.includes( code )
		? STORAGE_LIMIT_REACHED
		: 'GENERAL';
}
