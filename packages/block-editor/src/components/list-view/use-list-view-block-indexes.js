/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

export default function useListViewBlockIndexes( blocks ) {
	const blockIndexes = useMemo( () => {
		const indexes = {};

		let currentGlobalIndex = 0;

		const traverseBlocks = ( blockList ) => {
			blockList.forEach( ( block ) => {
				indexes[ block.clientId ] = currentGlobalIndex;
				currentGlobalIndex++;

				if ( block.innerBlocks.length > 0 ) {
					traverseBlocks( block.innerBlocks );
				}
			} );
		};

		traverseBlocks( blocks );

		return indexes;
	}, [ blocks ] );

	return blockIndexes;
}
