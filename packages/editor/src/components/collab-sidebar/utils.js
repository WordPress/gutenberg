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
 * Extracts comment IDs from an array of blocks.
 *
 * This function recursively traverses the blocks and their inner blocks to
 * collect all comment IDs found in the block attributes.
 *
 * @param {Array} blocks - The array of blocks to extract comment IDs from.
 * @return {Array} An array of comment IDs extracted from the blocks.
 */
export function getCommentIdsFromBlocks( blocks ) {
	// Recursive function to extract comment IDs from blocks
	const extractCommentIds = ( items ) => {
		return items.reduce( ( commentIds, block ) => {
			// Check for comment IDs in the current block's attributes
			if (
				block.attributes &&
				block.attributes.blockCommentId &&
				! commentIds.includes( block.attributes.blockCommentId )
			) {
				commentIds.push( block.attributes.blockCommentId );
			}

			// Recursively check inner blocks
			if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
				const innerCommentIds = extractCommentIds( block.innerBlocks );
				commentIds.push( ...innerCommentIds );
			}

			return commentIds;
		}, [] );
	};

	// Extract all comment IDs recursively
	return extractCommentIds( blocks );
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
		if ( block.attributes?.blockCommentId === commentId ) {
			return block.clientId;
		}
		if ( block.innerBlocks ) {
			const found = findBlockByCommentId( commentId, block.innerBlocks );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}
