/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import {
	reduce,
	omit,
} from 'lodash';

/**
 * Reducer
 */

export default combineReducers( {
	data( state = {}, action ) {
		switch ( action.type ) {
			case 'FETCH_REUSABLE_BLOCKS_SUCCESS': {
				return reduce( action.reusableBlocks, ( newState, reusableBlock ) => ( {
					...newState,
					[ reusableBlock.id ]: reusableBlock,
				} ), state );
			}

			case 'UPDATE_REUSABLE_BLOCK': {
				const { id, reusableBlock } = action;
				const existingReusableBlock = state[ id ];

				return {
					...state,
					[ id ]: {
						...existingReusableBlock,
						...reusableBlock,
						attributes: {
							...( existingReusableBlock && existingReusableBlock.attributes ),
							...reusableBlock.attributes,
						},
					},
				};
			}
		}

		return state;
	},

	isSaving( state = {}, action ) {
		switch ( action.type ) {
			case 'SAVE_REUSABLE_BLOCK':
				return {
					...state,
					[ action.id ]: true,
				};

			case 'SAVE_REUSABLE_BLOCK_SUCCESS':
			case 'SAVE_REUSABLE_BLOCK_FAILURE': {
				const { id } = action;
				return omit( state, id );
			}
		}

		return state;
	},
} );

/**
 * Action creators
 */

/**
 * Returns an action object used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will be fetched
 * @return {Object}   Action object
 */
export function fetchReusableBlocks( id ) {
	return {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
}

/**
 * Returns an action object used to insert or update a reusable block into the store.
 *
 * @param {Object} id            The ID of the reusable block to update
 * @param {Object} reusableBlock The new reusable block object. Any omitted keys are not changed
 * @return {Object}              Action object
 */
export function updateReusableBlock( id, reusableBlock ) {
	return {
		type: 'UPDATE_REUSABLE_BLOCK',
		id,
		reusableBlock,
	};
}

/**
 * Returns an action object used to save a reusable block that's in the store
 * to the REST API.
 *
 * @param {Object} id The ID of the reusable block to save
 * @return {Object}   Action object
 */
export function saveReusableBlock( id ) {
	return {
		type: 'SAVE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used to convert a reusable block into a static
 * block.
 *
 * @param {Object} uid The ID of the block to attach
 * @return {Object}    Action object
 */
export function convertBlockToStatic( uid ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		uid,
	};
}

/**
 * Returns an action object used to convert a static block into a reusable
 * block.
 *
 * @param {Object} uid The ID of the block to detach
 * @return {Object}    Action object
 */
export function convertBlockToReusable( uid ) {
	return {
		type: 'CONVERT_BLOCK_TO_REUSABLE',
		uid,
	};
}

/**
 * Selectors
 */

/**
 * Returns the reusable block with the given ID.
 *
 * @param {Object} state Global application state
 * @param {String} ref   The reusable block's ID
 * @return {Object}      The reusable block, or null if none exists
 */
export function getReusableBlock( state, ref ) {
	return state.reusableBlocks.data[ ref ] || null;
}

/**
 * Returns whether or not the reusable block with the given ID is being saved.
 *
 * @param {*} state  Global application state
 * @param {*} ref    The reusable block's ID
 * @return {Boolean} Whether or not the reusable block is being saved
 */
export function isSavingReusableBlock( state, ref ) {
	return state.reusableBlocks.isSaving[ ref ] || false;
}

/**
 * Returns an array of all reusable blocks.
 *
 * @param {Object} state Global application state
 * @return {Array}       An array of all reusable blocks.
 */
export function getReusableBlocks( state ) {
	return Object.values( state.reusableBlocks.data );
}
