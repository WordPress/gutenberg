/**
 * @format
 * @flow
 */

import ActionTypes from './ActionTypes';

export type BlockActionType = number => {
	type: $Values<typeof ActionTypes.BLOCK>,
	rowId: number,
};

export const focusBlockAction: BlockActionType = ( index: number ) => ( {
	type: ActionTypes.BLOCK.FOCUS,
	rowId: index,
} );

export const moveBlockUpAction: BlockActionType = index => ( {
	type: ActionTypes.BLOCK.MOVE_UP,
	rowId: index,
} );

export const moveBlockDownAction: BlockActionType = index => ( {
	type: ActionTypes.BLOCK.MOVE_DOWN,
	rowId: index,
} );

export const deleteBlockAction: BlockActionType = index => ( {
	type: ActionTypes.BLOCK.DELETE,
	rowId: index,
} );
