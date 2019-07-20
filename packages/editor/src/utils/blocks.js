export const findDeepBlock = ( blocksToSearch, blockName ) => {
	let foundBlock = blocksToSearch.find( ( block ) => block.name === blockName );

	if ( foundBlock ) {
		return foundBlock;
	}

	for ( const block of blocksToSearch ) {
		foundBlock =
			block.innerBlocks && findDeepBlock( block.innerBlocks, blockName );
		if ( foundBlock ) {
			return foundBlock;
		}
	}
};
