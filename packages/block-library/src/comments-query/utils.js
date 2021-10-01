/**
 * Recurses over a list of blocks and returns the clientId
 * of the first found Comments Query Loop block.
 *
 * @param {WPBlock[]} blocks The list of blocks to look through.
 * @return {string=} The clientId.
 */

export const getFirstQueryClientIdFromBlocks = ( blocks ) => {
	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();
		if ( block.name === 'core/comments-query' ) {
			return block.clientId;
		}
		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}
};
