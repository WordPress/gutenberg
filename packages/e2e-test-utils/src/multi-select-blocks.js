/**
 * Internal dependencies
 */
import { getAllBlocks, wpDataDispatch, selectBlockByClientId } from './';
/**
 * Select multiple blocks on the editor given the start clientId and the end clientId.
 * First selects the start block in order to properly multi select.
 *
 * @param {string} start Identifier of the start block.
 * @param {string} end Identifier of the end block.
 */
export async function multiSelectBlocksByIds( start, end ) {
	await selectBlockByClientId( start );

	return wpDataDispatch( 'core/block-editor', 'multiSelect', start, end );
}

/**
 * Returns the block ids to multi select by the given arguements in `multiSelectBlocksByRange``
 * Validates if there can be a selection with given arguements.
 * If starting block reference is valid ( block exists in that position ) and
 * number of wanted blocks is bigger than the actual remaining blocks,
 * return the multi selection with just the remaining blocks.
 *
 * If not valid return null
 *
 * @param {number} startFrom The order of start block in editor.
 * @param {number} selectBlocks How many blocks should multi select.
 * @return {Promise<?Object<string, string>>} Returns Object with start and end block ids or null if invalid
 */
const getMultiSelectByRangeIds = async ( startFrom, selectBlocks ) => {
	const blocks = ( await getAllBlocks() ).map( ( { clientId } ) => clientId );
	const blocksLength = blocks.length;
	if ( blocksLength && blocksLength < startFrom ) return null;
	// we substract one since the start is included in the total selected blocks
	const endTo = Math.min( startFrom + selectBlocks - 1, blocksLength );
	return {
		start: blocks[ startFrom - 1 ],
		end: blocks[ endTo - 1 ],
	};
};

/**
 * Select multiple blocks on the editor given the start block order
 * and the total amount of wanted selected blocks.
 * Validates if not available blocks for selection.
 *
 * Also selects the start block in order to properly multi select.
 *
 * @example <caption>multiSelectBlocksByRange( 2, 3 )</caption>
 * // selects three blocks -- from the second block to fourth (2, 3, 4).
 *
 * @param {number} startFrom The order of start block in editor.
 * @param {number} selectBlocks How many blocks should multi select.
 */
export async function multiSelectBlocksByRange( startFrom, selectBlocks ) {
	const blockIds = await getMultiSelectByRangeIds( startFrom, selectBlocks );
	if ( ! blockIds ) return;

	const { start, end } = blockIds;
	return multiSelectBlocksByIds( start, end );
}
