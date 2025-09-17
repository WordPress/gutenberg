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
 * Extract a map of comment IDs to their block references from an array of blocks.
 * This is useful for linking comments to specific blocks in the editor.
 *
 * Only top-level comments are mapped to blocks.
 *
 * @param {Array} blocks - The array of blocks to extract comment IDs from.
 * @return {Object} An object mapping comment IDs to their block references.
 */
export function getcommentToBlockMapping( blocks ) {
	const commentToBlockMapping = [];

	// Recursive function to extract comment IDs and their block refs from blocks.
	const extractCommentIdsAndRefs = ( items ) => {
		items.forEach( ( block ) => {
			// Check for comment IDs in the current block's attributes
			if (
				block.attributes &&
				block.attributes.blockCommentId &&
				! commentToBlockMapping[ block.attributes.blockCommentId ]
			) {
				commentToBlockMapping[ block.attributes.blockCommentId ] = {
					blockCommentId: block.attributes.blockCommentId,
					commentPopoverRef: block.attributes.commentPopoverRef,
				};
			}

			// Recursively check inner blocks
			if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
				extractCommentIdsAndRefs( block.innerBlocks );
			}
		} );
	};

	// Extract all comment IDs and their block refs recursively.
	extractCommentIdsAndRefs( blocks );

	return commentToBlockMapping;
}
