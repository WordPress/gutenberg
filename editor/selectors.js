/**
 * External dependencies
 */
import { first, last, find } from 'lodash';
import createSelector from 'rememo';

/**
 * Returns all editor config object
 *
 * @param  {Object} state Global application state
 * @return {Object}       Editor Config
 */
export function getEditorConfig( state ) {
	return state.editorConfig;
}

/**
 * Returns a block type its name.
 *
 * @param  {Object} state Global application state
 * @param  {String} name  Block name
 * @return {Object}       BlockType
 */
export function getBlockType( state, name ) {
	return find( state.editorConfig.blockTypes, ( blockType ) => blockType.name === name );
}

/**
 * Returns all the available block types
 *
 * @param  {Object} state Global application state
 * @return {Array}        BlockTypes
 */
export function getBlockTypes( state ) {
	return state.editorConfig.blockTypes;
}

/**
 * Returns all the available block categories
 *
 * @param  {Object} state Global application state
 * @return {Array}        categories
 */
export function getCategories( state ) {
	return state.editorConfig.categories;
}

/**
 * Returns the default block type name.
 *
 * @param  {Object} state Global application state
 * @return {String}       Block name
 */
export function getDefaultBlockType( state ) {
	return state.editorConfig.defaultBlockType;
}

/**
 * Returns a block given its unique ID. This is a parsed copy of the block,
 * containing its `blockName`, identifier (`uid`), and current `attributes`
 * state. This is not the block's registration settings, which must be
 * retrieved from the blocks module registration store.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Parsed block object
 */
export function getBlock( state, uid ) {
	return state.editor.blocksByUid[ uid ];
}

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post.
 * Note: It's important to memoize this selector to avoid return a new instance on each call
 *
 * @param  {Object}   state Global application state
 * @return {Object[]}       Post blocks
 */
export const getBlocks = createSelector(
	( state ) => {
		return state.editor.blockOrder.map( ( uid ) => getBlock( state, uid ) );
	},
	( state ) => [
		state.editor.blockOrder,
		state.editor.blocksByUid,
	]
);

/**
 * Returns the number of blocks currently present in the post.
 *
 * @param  {Object} state Global application state
 * @return {Object}       Number of blocks in the post
 */
export function getBlockCount( state ) {
	return getBlockUids( state ).length;
}

/**
 * Returns the currently selected block, or null if there is no selected block.
 *
 * @param  {Object}  state Global application state
 * @return {?Object}       Selected block
 */
export function getSelectedBlock( state ) {
	const { uid } = state.selectedBlock;
	const { start, end } = state.multiSelectedBlocks;

	if ( start || end || ! uid ) {
		return null;
	}

	return getBlock( state, uid );
}

/**
 * Returns the current multi-selection set of blocks unique IDs, or an empty
 * array if there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block unique UDs
 */
export function getMultiSelectedBlockUids( state ) {
	const { blockOrder } = state.editor;
	const { start, end } = state.multiSelectedBlocks;

	if ( ! start || ! end ) {
		return [];
	}

	const startIndex = blockOrder.indexOf( start );
	const endIndex = blockOrder.indexOf( end );

	if ( startIndex > endIndex ) {
		return blockOrder.slice( endIndex, startIndex + 1 );
	}

	return blockOrder.slice( startIndex, endIndex + 1 );
}

/**
 * Returns the current multi-selection set of blocks, or an empty array if
 * there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block objects
 */
export function getMultiSelectedBlocks( state ) {
	return getMultiSelectedBlockUids( state ).map( ( uid ) => getBlock( state, uid ) );
}

/**
 * Returns the unique ID of the first block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       First unique block ID in the multi-selection set
 */
export function getFirstMultiSelectedBlockUid( state ) {
	return first( getMultiSelectedBlockUids( state ) ) || null;
}

/**
 * Returns the unique ID of the last block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Last unique block ID in the multi-selection set
 */
export function getLastMultiSelectedBlockUid( state ) {
	return last( getMultiSelectedBlockUids( state ) ) || null;
}

/**
 * Returns true if a multi-selection exists, and the block corresponding to the
 * specified unique ID is the first block of the multi-selection set, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is first in mult-selection
 */
export function isFirstMultiSelectedBlock( state, uid ) {
	return getFirstMultiSelectedBlockUid( state ) === uid;
}

/**
 * Returns true if the unique ID occurs within the block multi-selection, or
 * false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is in multi-selection set
 */
export function isBlockMultiSelected( state, uid ) {
	return getMultiSelectedBlockUids( state ).indexOf( uid ) !== -1;
}

/**
 * Returns the unique ID of the block which begins the multi-selection set, or
 * null if there is no multi-selection.
 *
 * N.b.: This is not necessarily the first uid in the selection. See
 * getFirstMultiSelectedBlockUid().
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID of block beginning multi-selection
 */
export function getMultiSelectedBlocksStartUid( state ) {
	return state.multiSelectedBlocks.start || null;
}

/**
 * Returns the unique ID of the block which ends the multi-selection set, or
 * null if there is no multi-selection.
 *
 * N.b.: This is not necessarily the last uid in the selection. See
 * getLastMultiSelectedBlockUid().
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID of block ending multi-selection
 */
export function getMultiSelectedBlocksEndUid( state ) {
	return state.multiSelectedBlocks.end || null;
}

/**
 * Returns an array containing all block unique IDs of the post being edited,
 * in the order they appear in the post.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Ordered unique IDs of post blocks
 */
export function getBlockUids( state ) {
	return state.editor.blockOrder;
}

/**
 * Returns the index at which the block corresponding to the specified unique
 * ID occurs within the post block order, or `-1` if the block does not exist.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Number}       Index at which block exists in order
 */
export function getBlockIndex( state, uid ) {
	return state.editor.blockOrder.indexOf( uid );
}

/**
 * Returns true if the block corresponding to the specified unique ID is the
 * first block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is first in post
 */
export function isFirstBlock( state, uid ) {
	return first( state.editor.blockOrder ) === uid;
}

/**
 * Returns true if the block corresponding to the specified unique ID is the
 * last block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is last in post
 */
export function isLastBlock( state, uid ) {
	return last( state.editor.blockOrder ) === uid;
}

/**
 * Returns the block object occurring before the one corresponding to the
 * specified unique ID.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block occurring before specified unique ID
 */
export function getPreviousBlock( state, uid ) {
	const order = getBlockIndex( state, uid );
	return state.editor.blocksByUid[ state.editor.blockOrder[ order - 1 ] ] || null;
}

/**
 * Returns the block object occurring after the one corresponding to the
 * specified unique ID.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block occurring after specified unique ID
 */
export function getNextBlock( state, uid ) {
	const order = getBlockIndex( state, uid );
	return state.editor.blocksByUid[ state.editor.blockOrder[ order + 1 ] ] || null;
}

/**
 * Returns true if the block corresponding to the specified unique ID is
 * currently selected and a multi-selection exists, null if there is no
 * multi-selection active, or false if multi-selection exists, but the
 * specified unique ID is not the selected block.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is selected and multi-selection exists
 */
export function isBlockSelected( state, uid ) {
	const { start, end } = state.multiSelectedBlocks;

	if ( start || end ) {
		return null;
	}

	return state.selectedBlock.uid === uid;
}

/**
 * Returns true if the cursor is hovering the block corresponding to the
 * specified unique ID, or false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is hovered
 */
export function isBlockHovered( state, uid ) {
	return state.hoveredBlock === uid;
}

/**
 * Returns focus state of the block corresponding to the specified unique ID,
 * or null if the block is not selected. It is left to a block's implementation
 * to manage the content of this object, defaulting to an empty object.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block focus state
 */
export function getBlockFocus( state, uid ) {
	if ( ! isBlockSelected( state, uid ) ) {
		return null;
	}

	return state.selectedBlock.focus;
}

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether user is typing
 */
export function isTyping( state ) {
	return state.isTyping;
}

/**
 * Returns the unique ID of the block after which a new block insertion would
 * be placed, or null if the insertion point is not shown. Defaults to the
 * unique ID of the last block occurring in the post if not otherwise assigned.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID after which insertion will occur
 */
export function getBlockInsertionPoint( state ) {
	const lastMultiSelectedBlock = getLastMultiSelectedBlockUid( state );
	if ( lastMultiSelectedBlock ) {
		return lastMultiSelectedBlock;
	}

	const selectedBlock = getSelectedBlock( state );
	if ( selectedBlock ) {
		return selectedBlock.uid;
	}

	return last( state.editor.blockOrder );
}

/**
 * Returns true if we should show the block insertion point
 *
 * @param  {Object}  state Global application state
 * @return {?Boolean}      Whether the insertion point is visible or not
 */
export function isBlockInsertionPointVisible( state ) {
	return state.showInsertionPoint;
}

/**
 * Resolves the list of recently used block names into a list of block type settings.
 *
 * @param {Object} state Global application state
 * @return {Array}       List of recently used blocks
 */
export function getRecentlyUsedBlocks( state ) {
	// resolves the block names in the state to the block type settings
	return state.userData.recentlyUsedBlocks.map( ( blockName ) => getBlockType( state, blockName ) );
}
