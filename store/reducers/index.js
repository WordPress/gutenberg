/**
 * @format
 * @flow
 */

import { find, findIndex, reduce } from 'lodash';
import { DataSource } from 'react-native-recyclerview-list';

import ActionTypes from '../actions/ActionTypes';
import type { StateType, BlockType } from '../';
import type { BlockActionType } from '../actions';

function findBlock( dataSource, uid: string ) {
	return find( dataSource._data, obj => {
		return obj.uid === uid;
	} );
}

function findBlockIndex( dataSource, uid: string ) {
	return findIndex( dataSource._data, obj => {
		return obj.uid === uid;
	} );
}

export const reducer = (
	state: StateType = { dataSource: new DataSource( [], ( item: BlockType, index ) => item.uid ), refresh: false },
	action: BlockActionType
) => {
	const dataSource : DataSource = state.dataSource;
	switch ( action.type ) {
		case ActionTypes.BLOCK.UPDATE_ATTRIBUTES:
			const block = findBlock( dataSource, action.uid );

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
						if ( result === findBlock( dataSource, action.uid ).attributes ) {
							result = { ...result };
						}

						result[ key ] = value;
					}

					return result;
				},
				findBlock( dataSource, action.uid ).attributes
			);

			// Skip update if nothing has been changed. The reference will
			// match the original block if `reduce` had no changed values.
			if ( nextAttributes === findBlock( dataSource, action.uid ).attributes ) {
				return state;
			}

			// Otherwise merge attributes into state
			var index = findBlockIndex( dataSource, action.uid );
			dataSource.get(index ).set({
				...block,
				attributes: nextAttributes,
			});
			return { dataSource: dataSource, refresh: ! state.refresh };
		case ActionTypes.BLOCK.FOCUS:
			console.log(dataSource._data)
			const destBlock = findBlock( dataSource, action.uid );
			const destBlockState = destBlock.focused;
			// Deselect all blocks
			for ( let block of dataSource._data ) {
				block.focused = false;
			}
			// Select or deselect pressed block
			destBlock.focused = ! destBlockState;
			return { dataSource: dataSource, refresh: ! state.refresh };
		case ActionTypes.BLOCK.MOVE_UP:
			var index = findBlockIndex( dataSource, action.uid );
			dataSource.moveUp(index)
			return { dataSource: dataSource, refresh: ! state.refresh };
		case ActionTypes.BLOCK.MOVE_DOWN:
			var index = findBlockIndex( dataSource, action.uid );
			dataSource.moveDown(index)
			return { dataSource: dataSource, refresh: ! state.refresh };
		case ActionTypes.BLOCK.DELETE:
			var index = findBlockIndex( dataSource, action.uid );
			dataSource.splice( index, 1 );
			return { dataSource: dataSource, refresh: ! state.refresh };
		default:
			return state;
	}
};
