import { useMemo } from '@wordpress/element';
import type { ClientIdsTreeNode } from '../../store/types';

export default function useListViewBlockIndexes( blocks: ClientIdsTreeNode[] ) {
	const blockIndexes = useMemo( () => {
		const indexes: Partial< Record< string, number > > = {};

		let currentGlobalIndex = 0;

		const traverseBlocks = ( blockList: ClientIdsTreeNode[] ) => {
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
