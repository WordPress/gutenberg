/**
 * @format
 * @flow
 */

import { find, findIndex, reduce } from 'lodash';

import ActionTypes from '../actions/ActionTypes';
import type { StateType } from '../';
import type { BlockActionType } from '../actions';

function findBlock( blocks, uid: string ) {
	return find( blocks, obj => {
		return obj.uid === uid;
	} );
}

function findBlockIndex( blocks, uid: string ) {
	return findIndex( blocks, obj => {
		return obj.uid === uid;
	} );
}

export const reducer = (
	state: StateType = { blocks: [], refresh: false },
	action: BlockActionType
) => {
	const blocks = [ ...state.blocks ];
	switch ( action.type ) {
		case ActionTypes.BLOCK.UPDATE_ATTRIBUTES: {
			const block = findBlock( blocks, action.uid );

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
						if ( result === findBlock( blocks, action.uid ).attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				},
				findBlock( blocks, action.uid ).attributes
			);

			// Skip update if nothing has been changed. The reference will
			// match the original block if `reduce` had no changed values.
			if ( nextAttributes === findBlock( blocks, action.uid ).attributes ) {
				return state;
			}

			// Otherwise merge attributes into state
			const index = findBlockIndex( blocks, action.uid );
			blocks[ index ] = {
				...block,
				attributes: nextAttributes,
			};

			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.FOCUS: {
			const destBlock = findBlock( blocks, action.uid );
			const destBlockState = destBlock.focused;

			// Deselect all blocks
			for ( const block of blocks ) {
				block.focused = false;
			}

			// Select or deselect pressed block
			destBlock.focused = ! destBlockState;
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.MOVE_UP: {
			if ( blocks[ 0 ].uid === action.uid ) {
				return state;
			}

			const index = findBlockIndex( blocks, action.uid );
			const tmp = blocks[ index ];
			blocks[ index ] = blocks[ index - 1 ];
			blocks[ index - 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.MOVE_DOWN: {
			if ( blocks[ blocks.length - 1 ].uid === action.uid ) {
				return state;
			}

			const index = findBlockIndex( blocks, action.uid );
			const tmp = blocks[ index ];
			blocks[ index ] = blocks[ index + 1 ];
			blocks[ index + 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.DELETE: {
			const index = findBlockIndex( blocks, action.uid );
			blocks.splice( index, 1 );
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.CREATE: {
			// TODO we need to set focused: true and search for the currently focused block and
			// set that one to `focused: false`.
			blocks.push(action.block);
			return { blocks: blocks, refresh: ! state.refresh };
		}
		default:
			return state;
	}
};
