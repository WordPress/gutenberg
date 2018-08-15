/**
 * @format
 * @flow
 */

import { find, findIndex, reduce } from 'lodash';

import ActionTypes from '../actions/ActionTypes';
import type { StateType } from '../';
import type { BlockActionType } from '../actions';
import { parse } from '@wordpress/blocks';

function findBlock( blocks, clientId: string ) {
	return find( blocks, ( obj ) => {
		return obj.clientId === clientId;
	} );
}

function findBlockIndex( blocks, clientId: string ) {
	return findIndex( blocks, ( obj ) => {
		return obj.clientId === clientId;
	} );
}

export const reducer = (
	state: StateType = { blocks: [], refresh: false },
	action: BlockActionType
) => {
	const blocks = [ ...state.blocks ];
	switch ( action.type ) {
		case ActionTypes.BLOCK.UPDATE_ATTRIBUTES: {
			const block = findBlock( blocks, action.clientId );

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
						if ( result === findBlock( blocks, action.clientId ).attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				},
				findBlock( blocks, action.clientId ).attributes
			);

			// Skip update if nothing has been changed. The reference will
			// match the original block if `reduce` had no changed values.
			if ( nextAttributes === findBlock( blocks, action.clientId ).attributes ) {
				return state;
			}

			// Otherwise merge attributes into state
			const index = findBlockIndex( blocks, action.clientId );
			blocks[ index ] = {
				...block,
				attributes: nextAttributes,
			};

			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.FOCUS: {
			const destBlock = findBlock( blocks, action.clientId );
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
			if ( blocks[ 0 ].clientId === action.clientId ) {
				return state;
			}

			const index = findBlockIndex( blocks, action.clientId );
			const tmp = blocks[ index ];
			blocks[ index ] = blocks[ index - 1 ];
			blocks[ index - 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.MOVE_DOWN: {
			if ( blocks[ blocks.length - 1 ].clientId === action.clientId ) {
				return state;
			}

			const index = findBlockIndex( blocks, action.clientId );
			const tmp = blocks[ index ];
			blocks[ index ] = blocks[ index + 1 ];
			blocks[ index + 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.DELETE: {
			const index = findBlockIndex( blocks, action.clientId );
			blocks.splice( index, 1 );
			return { blocks: blocks, refresh: ! state.refresh };
		}
		case ActionTypes.BLOCK.PARSE: {
			const parsed = parse( action.html );
			return { blocks: parsed, refresh: ! state.refresh, fullparse: true };
		}
		default:
			return state;
	}
};
