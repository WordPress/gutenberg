/**
 * External dependencies
 */
import createSelector from 'rememo';
import { first, last } from 'lodash';

/**
 * Internal dependencies
 */
import { getBlock } from './editor';

/**
 * Reducer
 */

/**
 * Reducer returning the block selection's state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export default function blockSelection( state = { start: null, end: null, focus: null, isMultiSelecting: false }, action ) {
	switch ( action.type ) {
		case 'CLEAR_SELECTED_BLOCK':
			return {
				start: null,
				end: null,
				focus: null,
				isMultiSelecting: false,
			};
		case 'START_MULTI_SELECT':
			return {
				...state,
				isMultiSelecting: true,
			};
		case 'STOP_MULTI_SELECT':
			return {
				...state,
				isMultiSelecting: false,
				focus: state.start === state.end ? state.focus : null,
			};
		case 'MULTI_SELECT':
			return {
				...state,
				start: action.start,
				end: action.end,
				focus: state.isMultiSelecting ? state.focus : null,
			};
		case 'SELECT_BLOCK':
			if ( action.uid === state.start && action.uid === state.end ) {
				return state;
			}
			return {
				...state,
				start: action.uid,
				end: action.uid,
				focus: action.focus || {},
			};
		case 'UPDATE_FOCUS':
			return {
				...state,
				start: action.uid,
				end: action.uid,
				focus: action.config || {},
			};
		case 'INSERT_BLOCKS':
			return {
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
				focus: {},
				isMultiSelecting: false,
			};
		case 'REPLACE_BLOCKS':
			if ( ! action.blocks || ! action.blocks.length || action.uids.indexOf( state.start ) === -1 ) {
				return state;
			}
			return {
				start: action.blocks[ 0 ].uid,
				end: action.blocks[ 0 ].uid,
				focus: {},
				isMultiSelecting: false,
			};
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object signalling that the focus state for a block by the
 * specified UID should be assigned.
 *
 * @param  {String} uid    Block UID
 * @param  {Object} config Focus configuration
 * @return {Object}        Action object
 */
export function focusBlock( uid, config ) {
	return {
		type: 'UPDATE_FOCUS',
		uid,
		config,
	};
}

/**
 * Returns an action object signalling that a block should be selected.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function selectBlock( uid ) {
	return {
		type: 'SELECT_BLOCK',
		uid,
	};
}

/**
 * Returns an action object signalling that the currently selected block should
 * be reset.
 *
 * @return {Object}     Action object
 */
export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK',
	};
}

/**
 * Returns an action object signalling that block multi-selection has started.
 *
 * @return {Object} Action object
 */
export function startMultiSelect() {
	return {
		type: 'START_MULTI_SELECT',
	};
}

/**
 * Returns an action object signalling that block multi-selection has stopped.
 *
 * @return {Object} Action object
 */
export function stopMultiSelect() {
	return {
		type: 'STOP_MULTI_SELECT',
	};
}

/**
 * Returns an action object signalling that multi-selection should be applied
 * to the specified start and end offsets.
 *
 * @param  {Number} start Start offset for multi-selection
 * @param  {Number} end   End offset for multi-selection
 * @return {Object}       Action object
 */
export function multiSelect( start, end ) {
	return {
		type: 'MULTI_SELECT',
		start,
		end,
	};
}

/**
 * Selectors
 */

/**
 * Returns the currently selected block, or null if there is no selected block.
 *
 * @param  {Object}  state Global application state
 * @return {?Object}       Selected block
 */
export function getSelectedBlock( state ) {
	const { start, end } = state.blockSelection;
	if ( start !== end || ! start ) {
		return null;
	}

	return getBlock( state, start );
}

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @param  {Object} state Global application state
 * @return {Number}       Number of blocks selected in the post
 */
export function getSelectedBlockCount( state ) {
	const multiSelectedBlockCount = getMultiSelectedBlockUids( state ).length;

	if ( multiSelectedBlockCount ) {
		return multiSelectedBlockCount;
	}

	return state.blockSelection.start ? 1 : 0;
}

/**
 * Returns the current multi-selection set of blocks unique IDs, or an empty
 * array if there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block unique UDs
 */
export const getMultiSelectedBlockUids = createSelector(
	( state ) => {
		const { blockOrder } = state.editor.present;
		const { start, end } = state.blockSelection;
		if ( start === end ) {
			return [];
		}

		const startIndex = blockOrder.indexOf( start );
		const endIndex = blockOrder.indexOf( end );

		if ( startIndex > endIndex ) {
			return blockOrder.slice( endIndex, startIndex + 1 );
		}

		return blockOrder.slice( startIndex, endIndex + 1 );
	},
	( state ) => [
		state.editor.present.blockOrder,
		state.blockSelection.start,
		state.blockSelection.end,
	],
);

/**
 * Returns the current multi-selection set of blocks, or an empty array if
 * there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block objects
 */
export const getMultiSelectedBlocks = createSelector(
	( state ) => getMultiSelectedBlockUids( state ).map( ( uid ) => getBlock( state, uid ) ),
	( state ) => [
		state.editor.present.blockOrder,
		state.blockSelection.start,
		state.blockSelection.end,
		state.editor.present.blocksByUid,
		state.editor.present.edits.meta,
		state.currentPost.meta,
	]
);

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
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return start || null;
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
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return end || null;
}

/**
 * Returns true if the block corresponding to the specified unique ID is
 * currently selected but isn't the last of the selected blocks. Here "last"
 * refers to the block sequence in the document, _not_ the sequence of
 * multi-selection, which is why `state.blockSelection.end` isn't used.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is selected and not the last in the selection
 */
export function isBlockWithinSelection( state, uid ) {
	if ( ! uid ) {
		return false;
	}

	const uids = getMultiSelectedBlockUids( state );
	const index = uids.indexOf( uid );
	return index > -1 && index < uids.length - 1;
}

/**
 * Returns true if the block corresponding to the specified unique ID is
 * currently selected and no multi-selection exists, or false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is selected and multi-selection exists
 */
export function isBlockSelected( state, uid ) {
	const { start, end } = state.blockSelection;

	if ( start !== end ) {
		return false;
	}

	return start === uid;
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
	// If there is multi-selection, keep returning the focus object for the start block.
	if ( ! isBlockSelected( state, uid ) && state.blockSelection.start !== uid ) {
		return null;
	}

	return state.blockSelection.focus;
}

/**
 * Whether in the process of multi-selecting or not.
 *
 * @param  {Object} state Global application state
 * @return {Boolean}      True if multi-selecting, false if not.
 */
export function isMultiSelecting( state ) {
	return state.blockSelection.isMultiSelecting;
}
