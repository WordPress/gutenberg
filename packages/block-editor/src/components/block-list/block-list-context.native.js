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

/**
 * Finds a block's layout data within the provided data object.
 *
 * @param {Object} data     Blocks layouts list.
 * @param {string} clientId Block's clientId.
 *
 * @return {Object} Found block layout data.
 */
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

/**
 * Deletes a block's layout data from the provided data object.
 *
 * @param {Object} data     Blocks layouts list.
 * @param {string} clientId Block's clientsId.
 *
 * @return {Object} Updated data object.
 */
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

/**
 * Updates the blocksLayouts object with the block's layout data.
 *
 * @param {Object}   blocksLayouts          Blocks layouts list.
 * @param {Object}   blockData              Block's layout data.
 * @param {string}   blockData.clientId     Block's clientId.
 * @param {?string}  blockData.rootClientId Optional. Block's rootClientId.
 * @param {?boolean} blockData.shouldRemove Optional. Flag to remove it from the blocksLayout list.
 * @param {number}   blockData.width        Block's width.
 * @param {number}   blockData.heigth       Block's heigth.
 * @param {number}   blockData.x            Block's x coordinate (relative to the parent).
 * @param {number}   blockData.y            Block's y coordinate (relative to the parent).
 */

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

/**
 * Hook that returns the block list context.
 *
 * @return {Object} Block list context
 */
export const useBlockListContext = () => {
	return useContext( Context );
};
