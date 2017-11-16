/**
 * Internal dependencies
 */
import { getBlockIndex } from './editor';
import { getLastMultiSelectedBlockUid, getSelectedBlock } from './block-selection';
import { getEditorMode } from './preferences';

/**
 * Reducer
 */

/**
 * Reducer returning the block insertion point
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export default function blockInsertionPoint( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_INSERTION_POINT':
			const { position } = action;
			return { ...state, position };

		case 'CLEAR_BLOCK_INSERTION_POINT':
			return { ...state, position: null };

		case 'SHOW_INSERTION_POINT':
			return { ...state, visible: true };

		case 'HIDE_INSERTION_POINT':
			return { ...state, visible: false };
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object used in signalling that the block insertion point
 * should be made visible.
 *
 * @return {Object} Action object
 */
export function showInsertionPoint() {
	return {
		type: 'SHOW_INSERTION_POINT',
	};
}

/**
 * Returns an action object used in signalling that the block insertion point
 * should be hidden.
 *
 * @return {Object} Action object
 */
export function hideInsertionPoint() {
	return {
		type: 'HIDE_INSERTION_POINT',
	};
}

/**
 * Returns an action object used in signalling that block insertion should
 * occur at the specified block index position.
 *
 * @param  {Number} position Position at which to insert
 * @return {Object}          Action object
 */
export function setBlockInsertionPoint( position ) {
	return {
		type: 'SET_BLOCK_INSERTION_POINT',
		position,
	};
}

/**
 * Returns an action object used in signalling that the block insertion point
 * should be reset.
 *
 * @return {Object} Action object
 */
export function clearBlockInsertionPoint() {
	return {
		type: 'CLEAR_BLOCK_INSERTION_POINT',
	};
}

/**
 * Selectors
 */

/**
 * Returns the insertion point, the index at which the new inserted block would
 * be placed. Defaults to the last position
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID after which insertion will occur
 */
export function getBlockInsertionPoint( state ) {
	if ( getEditorMode( state ) !== 'visual' ) {
		return state.editor.present.blockOrder.length;
	}

	const position = getBlockSiblingInserterPosition( state );
	if ( null !== position ) {
		return position;
	}

	const lastMultiSelectedBlock = getLastMultiSelectedBlockUid( state );
	if ( lastMultiSelectedBlock ) {
		return getBlockIndex( state, lastMultiSelectedBlock ) + 1;
	}

	const selectedBlock = getSelectedBlock( state );
	if ( selectedBlock ) {
		return getBlockIndex( state, selectedBlock.uid ) + 1;
	}

	return state.editor.present.blockOrder.length;
}

/**
 * Returns the position at which the block inserter will insert a new adjacent
 * sibling block, or null if the inserter is not actively visible.
 *
 * @param  {Object}  state Global application state
 * @return {?Number}       Whether the inserter is currently visible
 */
export function getBlockSiblingInserterPosition( state ) {
	const { position } = state.blockInsertionPoint;
	if ( ! Number.isInteger( position ) ) {
		return null;
	}

	return position;
}

/**
 * Returns true if we should show the block insertion point
 *
 * @param  {Object}  state Global application state
 * @return {?Boolean}      Whether the insertion point is visible or not
 */
export function isBlockInsertionPointVisible( state ) {
	return !! state.blockInsertionPoint.visible;
}
