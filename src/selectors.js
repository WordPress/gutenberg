import { first, last } from 'lodash';

/**
 * Returns the current editing mode.
 *
 * @param  {Object} state Global application state
 * @return {String}       Editing mode
 */
export function getEditorMode(state) {
  return state.mode;
}

export function isBlockSelected(state, uid) {
  return state.selectedBlock === uid;
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
export function getBlock(state, uid) {
  return state.blocksByUid[uid];
}

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post.
 *
 * @param  {Object}   state Global application state
 * @return {Object[]}       Post blocks
 */
export function getBlocks(state) {
  return state.blockOrder.map(uid => state.blocksByUid[uid]);
}


/**
 * Returns true if the block corresponding to the specified unique ID is the
 * first block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {Object}  uid   Block unique ID
 * @return {Boolean}       Whether block is first in post
 */
export function isFirstBlock(state, uid) {
  return first(state.blockOrder) === uid;
}

/**
 * Returns true if the block corresponding to the specified unique ID is the
 * last block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {Object}  uid   Block unique ID
 * @return {Boolean}       Whether block is last in post
 */
export function isLastBlock(state, uid) {
  return last(state.blockOrder) === uid;
}
