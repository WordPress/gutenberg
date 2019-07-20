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

export const findDeepBlocks = ( blocksToSearch, blockName, foundBlocks = [] ) => {
	foundBlocks.push( ...blocksToSearch.filter( ( block ) => block.name === blockName ) );

	for ( const block of blocksToSearch ) {
		if ( block.innerBlocks ) {
			foundBlocks.push( ...findDeepBlocks( block.innerBlocks, blockName ) );
		}
	}

	return foundBlocks;
};
