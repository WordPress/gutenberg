/**
 * Recursively extracts image attachment IDs from blocks.
 *
 * @param {Array} blocks List of blocks to search.
 * @return {Set<number>} Set of attachment IDs found.
 */
export function getImageAttachmentIds( blocks ) {
	const ids = new Set();
	for ( const block of blocks ) {
		if ( block.name === 'core/image' && block.attributes.id ) {
			ids.add( block.attributes.id );
		}
		if ( block.name === 'core/media-text' && block.attributes.mediaId ) {
			ids.add( block.attributes.mediaId );
		}
		if ( block.name === 'core/cover' && block.attributes.id ) {
			ids.add( block.attributes.id );
		}
		if ( block.innerBlocks?.length ) {
			for ( const id of getImageAttachmentIds( block.innerBlocks ) ) {
				ids.add( id );
			}
		}
	}
	return ids;
}
