/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { orderBy } from '../../utils/sorting';

export const DEFAULT_BLOCK_LIST_CONTEXT = {
	scrollRef: null,
	blocksLayouts: { current: {} },
	findBlockLayoutByClientId,
	getBlockLayoutsOrderedByYCoord,
	findBlockLayoutByPosition,
	updateBlocksLayouts,
};

const Context = createContext( DEFAULT_BLOCK_LIST_CONTEXT );
const { Provider, Consumer } = Context;

/**
 * Finds a block's layout data by position.
 *
 * @param {Object} data       Blocks layouts object.
 * @param {Object} position   Position to use for finding the block.
 * @param {number} position.x X coordinate.
 * @param {number} position.y Y coordinate.
 *
 * @return {Object|undefined} Found block layout data that matches the provided position. If none is found, `undefined` will be returned.
 */
function findBlockLayoutByPosition( data, position ) {
	// Only enabled for root level blocks
	return Object.values( data ).find( ( block ) => {
		return (
			position.x >= block.x &&
			position.x <= block.x + block.width &&
			position.y >= block.y &&
			position.y <= block.y + block.height
		);
	} );
}

/**
 * Finds a block's layout data by its client Id.
 *
 * @param {Object} data     Blocks layouts object.
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
 * Deletes the layout data of a block by its client Id.
 *
 * @param {Object} data     Blocks layouts object.
 * @param {string} clientId Block's clientsId.
 *
 * @return {Object} Updated data object.
 */
export function deleteBlockLayoutByClientId( data, clientId ) {
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
 * Orders the block's layout data by its Y coordinate.
 *
 * @param {Object} data Blocks layouts object.
 *
 * @return {Object} Blocks layouts object ordered by its Y coordinate.
 */
function getBlockLayoutsOrderedByYCoord( data ) {
	// Only enabled for root level blocks.
	return orderBy( Object.values( data ), 'y' );
}

/**
 * Updates or deletes a block's layout data in the blocksLayouts object,
 * in case of deletion, the layout data is not required.
 *
 * @param {Object}   blocksLayouts          Blocks layouts object.
 * @param {Object}   blockData              Block's layout data to add or remove to/from the blockLayouts object.
 * @param {string}   blockData.clientId     Block's clientId.
 * @param {?string}  blockData.rootClientId Optional. Block's rootClientId.
 * @param {?boolean} blockData.shouldRemove Optional. Flag to remove it from the blocksLayout list.
 * @param {number}   blockData.width        Block's width.
 * @param {number}   blockData.height       Block's height.
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
