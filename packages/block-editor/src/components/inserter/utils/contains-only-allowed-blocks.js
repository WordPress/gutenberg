export default function containsOnlyAllowedBlocks(
	blocks = [],
	allowedBlocks = []
) {
	if ( ! blocks.length ) {
		return true;
	}

	for ( const block of blocks ) {
		const isBlockAllowed = allowedBlocks.includes(
			( allowedBlock ) => allowedBlock.name === block.name
		);

		if ( ! isBlockAllowed ) {
			return false;
		}
	}

	for ( const block of blocks ) {
		if ( ! containsOnlyAllowedBlocks( block.innerBlocks, allowedBlocks ) ) {
			return false;
		}
	}

	return true;
}
