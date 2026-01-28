/**
 * Preserves clientIds from previously rendered blocks to prevent flashing.
 * Matches blocks by name between renders to maintain React key stability.
 *
 * @param {Array} newBlocks  Newly parsed blocks with fresh clientIds.
 * @param {Array} prevBlocks Previously rendered blocks with stable clientIds.
 * @return {Array} Blocks with preserved clientIds where possible.
 */
export function preserveClientIds( newBlocks, prevBlocks ) {
	if ( ! prevBlocks?.length || ! newBlocks?.length ) {
		return newBlocks;
	}

	// Track which prevBlocks have been used.
	const usedPrevIndices = new Set();

	return newBlocks.map( ( newBlock, newIndex ) => {
		// Try to find a matching block in prevBlocks by name.
		// First, try the same index position.
		if (
			prevBlocks[ newIndex ] &&
			prevBlocks[ newIndex ].name === newBlock.name &&
			! usedPrevIndices.has( newIndex )
		) {
			usedPrevIndices.add( newIndex );
			return {
				...newBlock,
				clientId: prevBlocks[ newIndex ].clientId,
				innerBlocks: preserveClientIds(
					newBlock.innerBlocks,
					prevBlocks[ newIndex ].innerBlocks
				),
			};
		}

		// Otherwise, find the first unused block with matching name.
		for ( let i = 0; i < prevBlocks.length; i++ ) {
			if (
				! usedPrevIndices.has( i ) &&
				prevBlocks[ i ].name === newBlock.name
			) {
				usedPrevIndices.add( i );
				return {
					...newBlock,
					clientId: prevBlocks[ i ].clientId,
					innerBlocks: preserveClientIds(
						newBlock.innerBlocks,
						prevBlocks[ i ].innerBlocks
					),
				};
			}
		}

		// No match found, keep new clientId.
		return newBlock;
	} );
}
