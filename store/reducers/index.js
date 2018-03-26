/** @format */

import { find, reduce } from 'lodash';

import ActionTypes from '../actions/ActionTypes';

function findBlock( state, uid: integer ) {
	return find( state.blocks, obj => {
		return obj.key === uid;
	} );
}

export const reducer = ( state = {}, action ) => {
	switch ( action.type ) {
		case ActionTypes.BLOCK.UPDATE_ATTRIBUTES:
			const block = findBlock( state, action.uid );

			// Ignore updates if block isn't known
			if ( ! block ) {
				return state;
			}

			// Consider as updates only changed values
			const nextAttributes = reduce(
				action.attributes,
				( result, value, key ) => {
					if ( value !== result[ key ] ) {
						// Avoid mutating original block by creating shallow clone
						if ( result === findBlock( state, action.uid ).attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				},
				state.blocks[ action.uid ].attributes
			);

			// Skip update if nothing has been changed. The reference will
			// match the original block if `reduce` had no changed values.
			if ( nextAttributes === findBlock( state, action.uid ).attributes ) {
				return state;
			}

			// Otherwise merge attributes into state
			const blocks = [ ...state.blocks ];
			blocks[ action.uid ] = {
				...blocks[ action.uid ],
				attributes: nextAttributes,
			};
			return { blocks: blocks, refresh: ! state.refresh };
		case ActionTypes.BLOCK.FOCUS:
			var blocks = [ ...state.blocks ];
			const currentBlockState = blocks[ action.rowId ].focused;
			// Deselect all blocks
			for ( let block of blocks ) {
				block.focused = false;
			}
			// Select or deselect pressed block
			blocks[ action.rowId ].focused = ! currentBlockState;
			return { blocks: blocks, refresh: ! state.refresh };
		case ActionTypes.BLOCK.MOVE_UP:
			if ( action.rowId == 0 ) return state;

			var blocks = [ ...state.blocks ];
			var tmp = blocks[ action.rowId ];
			blocks[ action.rowId ] = blocks[ action.rowId - 1 ];
			blocks[ action.rowId - 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		case ActionTypes.BLOCK.MOVE_DOWN:
			if ( action.rowId == state.blocks.length - 1 ) return state;

			var blocks = [ ...state.blocks ];
			var tmp = blocks[ action.rowId ];
			blocks[ action.rowId ] = blocks[ action.rowId + 1 ];
			blocks[ action.rowId + 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		case ActionTypes.BLOCK.DELETE:
			var blocks = [ ...state.blocks ];
			blocks.splice( action.rowId, 1 );
			return { blocks: blocks, refresh: ! state.refresh };
		default:
			return state;
	}
};
