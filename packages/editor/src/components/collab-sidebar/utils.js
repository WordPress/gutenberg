/**
 * Sanitizes a comment string by removing non-printable ASCII characters.
 *
 * @param {string} str - The comment string to sanitize.
 * @return {string} - The sanitized comment string.
 */
export function sanitizeCommentString( str ) {
	return str.trim();
}

/**
 * Finds the first block that has the specified comment ID.
 *
 * @param {string} commentId - The comment ID to search for.
 * @param {Array}  blockList - The list of blocks to search through.
 * @return {string|null} The client ID of the found block, or null if not found.
 */
export function findBlockByCommentId( commentId, blockList ) {
	for ( const block of blockList ) {
		if ( block.id === commentId ) {
			return block.blockClientId;
		}
	}
	return null;
}
