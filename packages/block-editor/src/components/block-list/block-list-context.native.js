/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const DEFAULT_BLOCK_LIST_CONTEXT = {
	scrollRef: null,
	blocksLayouts: { current: {} },
	updateBlocksLayouts,
};

const Context = createContext( DEFAULT_BLOCK_LIST_CONTEXT );
const { Provider, Consumer } = Context;

function findBlockLayoutByClientId( data, clientId ) {
	return Object.entries( data ).reduce( ( acc, entry ) => {
		const item = entry[ 1 ];
		if ( acc ) {
			return acc;
		}
		if ( item?.clientId === clientId ) {
			return item;
		}
		if ( item?.innerBlocks && Object.keys( item.innerBlocks ).length > 0 ) {
			return findBlockLayoutByClientId( item.innerBlocks, clientId );
		}
		return null;
	}, null );
}

function deleteBlockLayoutByClientId( data, clientId ) {
	return Object.keys( data ).reduce( ( acc, key ) => {
		if ( key !== clientId ) {
			acc[ key ] = data[ key ];
		}
		if (
			data[ key ]?.innerBlocks &&
			Object.keys( data[ key ].innerBlocks ).length > 0
		) {
			if ( acc[ key ] ) {
				acc[ key ].innerBlocks = deleteBlockLayoutByClientId(
					data[ key ].innerBlocks,
					clientId
				);
			}
		}
		return acc;
	}, {} );
}

function updateBlocksLayouts( blocksLayouts, blockData ) {
	const { clientId, rootClientId, shouldRemove, ...layoutProps } = blockData;

	if ( clientId && shouldRemove ) {
		blocksLayouts.current = deleteBlockLayoutByClientId(
			blocksLayouts.current,
			clientId
		);
		return;
	}

	if ( clientId && ! rootClientId ) {
		blocksLayouts.current[ clientId ] = {
			clientId,
			rootClientId,
			...layoutProps,
			innerBlocks: {
				...blocksLayouts.current[ clientId ]?.innerBlocks,
			},
		};
	} else if ( clientId && rootClientId ) {
		const block = findBlockLayoutByClientId(
			blocksLayouts.current,
			rootClientId
		);

		if ( block ) {
			block.innerBlocks[ clientId ] = {
				clientId,
				rootClientId,
				...layoutProps,
				innerBlocks: {
					...block.innerBlocks[ clientId ]?.innerBlocks,
				},
			};
		}
	}
}

export { Provider as BlockListProvider, Consumer as BlockListConsumer };

export const useBlockListContext = () => {
	return useContext( Context );
};
