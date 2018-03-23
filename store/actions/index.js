/** @format */
import ActionTypes from './ActionTypes';

export const focusBlockAction = index => ( {
	type: ActionTypes.BLOCK.FOCUS,
	rowId: index,
} );

export const moveBlockUpAction = index => ( {
	type: ActionTypes.BLOCK.MOVE_UP,
	rowId: index,
} );

export const moveBlockDownAction = index => ( {
	type: ActionTypes.BLOCK.MOVE_DOWN,
	rowId: index,
} );

export const deleteBlockAction = index => ( {
	type: ActionTypes.BLOCK.DELETE,
	rowId: index,
} );
