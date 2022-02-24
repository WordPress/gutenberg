/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const blocksLayouts = { current: {} };

const Context = createContext( {
	scrollRef: null,
	blocksLayouts: {},
	updateBlocksLayouts: () => {},
} );
const { Provider, Consumer } = Context;

function findByRootId( data, rootClientId ) {
	return Object.entries( data ).reduce( ( acc, entry ) => {
		const item = entry[ 1 ];
		if ( acc ) {
			return acc;
		}
		if ( item?.clientId === rootClientId ) {
			return item;
		}
		if ( item?.innerBlocks && Object.keys( item.innerBlocks ).length > 0 ) {
			return findByRootId( item.innerBlocks, rootClientId );
		}
		return null;
	}, null );
}

function deleteByClientId( data, clientId ) {
	return Object.keys( data ).reduce( ( acc, key ) => {
		if ( key !== clientId ) {
			acc[ key ] = data[ key ];
		}
		if (
			data[ key ]?.innerBlocks &&
			Object.keys( data[ key ].innerBlocks ).length > 0
		) {
			if ( acc[ key ] ) {
				acc[ key ].innerBlocks = deleteByClientId(
					data[ key ].innerBlocks,
					clientId
				);
			}
		}
		return acc;
	}, {} );
}

function updateBlocksLayouts( blockData ) {
	const { clientId, rootClientId, shouldRemove, ...layoutProps } = blockData;

	if ( clientId && shouldRemove ) {
		blocksLayouts.current = deleteByClientId(
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
		const block = findByRootId( blocksLayouts.current, rootClientId );

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

export {
	Provider as BlockListProvider,
	Consumer as BlockListConsumer,
	updateBlocksLayouts,
	blocksLayouts,
};

export const useBlockListContext = () => {
	const blockListContext = useContext( Context );
	return blockListContext;
};
