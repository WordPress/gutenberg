/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer that tracks which attachments are in a guide. Each guide is represented by
 * an array which contains the tip identifiers contained within that guide.
 *
 * @param {Array}  state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
export function deletedAttachments( state = [], action ) {
	console.log( 'deletedAttachments', state, action );
	switch ( action.type ) {
		case 'REMOVE_ATTACHMENT':
			return [ ...state, action.attachment ];
	}

	return state;
}

export default combineReducers( { deletedAttachments } );
